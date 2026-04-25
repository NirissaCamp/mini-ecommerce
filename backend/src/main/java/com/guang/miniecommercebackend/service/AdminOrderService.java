package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.*;
import com.guang.miniecommercebackend.entity.*;
import com.guang.miniecommercebackend.repository.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminOrderService {

    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = new HashMap<>();
    static {
        VALID_TRANSITIONS.put(OrderStatus.PENDING,    Set.of(OrderStatus.PAID, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.PAID,       Set.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.PROCESSING, Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.SHIPPED,    Set.of(OrderStatus.DELIVERED));
        VALID_TRANSITIONS.put(OrderStatus.DELIVERED,  Set.of(OrderStatus.CLOSED));
        VALID_TRANSITIONS.put(OrderStatus.CLOSED,     Set.of());
        VALID_TRANSITIONS.put(OrderStatus.CANCELLED,  Set.of());
    }

    private final OrderRepository orderRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnItemRepository returnItemRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    public AdminOrderService(OrderRepository orderRepository,
                             ReturnRequestRepository returnRequestRepository,
                             ReturnItemRepository returnItemRepository,
                             UserRepository userRepository,
                             InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.returnItemRepository = returnItemRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    // ── Order management ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> listOrders(String status, Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        OrderStatus orderStatus = null;
        if (status != null && !status.isBlank()) {
            try { orderStatus = OrderStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status: " + status);
            }
        }
        Page<Order> orders;
        if (userId != null && orderStatus != null) {
            orders = orderRepository.findByUserIdAndStatus(userId, orderStatus, pageable);
        } else if (userId != null) {
            orders = orderRepository.findByUserId(userId, pageable);
        } else if (orderStatus != null) {
            orders = orderRepository.findByStatus(orderStatus, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return orders.map(o -> toAdminOrderResponse(o, false));
    }

    @Transactional(readOnly = true)
    public AdminOrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "order not found: " + orderId));
        return toAdminOrderResponse(order, true);
    }

    @Transactional
    public AdminOrderResponse updateStatus(Long orderId, OrderStatus newStatus, Long adminId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "order not found: " + orderId));
        OrderStatus current = order.getStatus();
        if (!VALID_TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "invalid status transition: " + current + " → " + newStatus);
        }
        if (newStatus == OrderStatus.SHIPPED) {
            for (OrderItem item : order.getItems()) {
                //  SHIPPED 时 fulfill
                //
                //  订单发货时，才做真实出库：onHand -= qty，同时 allocated -= qty
                //  这一步才是“货离开仓库”
                inventoryService.fulfill(item.getProductId(), item.getQuantity(), order.getId());
            }
        } else if (newStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                //  CANCELLED 时 deallocate
                //
                //  订单取消时，把之前锁住的 allocated 释放回 available
                //  不应再改 onHand（因为没发货）
                inventoryService.deallocate(item.getProductId(), item.getQuantity(), order.getId());
            }
        }
        order.setStatus(newStatus);
        orderRepository.save(order);
        return toAdminOrderResponse(order, true);
    }

    // ── Return management ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ReturnRequestResponse> listReturns(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
        Page<ReturnRequest> returns;
        if (status != null && !status.isBlank()) {
            try { returns = returnRequestRepository.findByStatus(ReturnStatus.valueOf(status.toUpperCase()), pageable); }
            catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid return status: " + status);
            }
        } else {
            returns = returnRequestRepository.findAll(pageable);
        }
        return returns.map(rr -> toReturnResponse(rr,
                returnItemRepository.findByReturnRequestId(rr.getId())));
    }

    @Transactional(readOnly = true)
    public ReturnRequestResponse getReturn(Long returnId) {
        ReturnRequest rr = getReturnOr404(returnId);
        return toReturnResponse(rr, returnItemRepository.findByReturnRequestId(returnId));
    }

    @Transactional
    public ReturnRequestResponse approveReturn(Long returnId, Long adminId) {
        ReturnRequest rr = getReturnOr404(returnId);
        if (rr.getStatus() != ReturnStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "can only approve a REQUESTED return");
        }
        List<ReturnItem> items = returnItemRepository.findByReturnRequestId(returnId);
        for (ReturnItem ri : items) {
            inventoryService.processReturn(ri.getProductId(), ri.getQuantity(), returnId);
        }
        rr.setStatus(ReturnStatus.APPROVED);
        rr.setResolvedAt(LocalDateTime.now());
        rr.setResolvedBy(adminId);
        returnRequestRepository.save(rr);
        return toReturnResponse(rr, items);
    }

    @Transactional
    public ReturnRequestResponse rejectReturn(Long returnId, String reason, Long adminId) {
        ReturnRequest rr = getReturnOr404(returnId);
        if (rr.getStatus() != ReturnStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "can only reject a REQUESTED return");
        }
        rr.setStatus(ReturnStatus.REJECTED);
        rr.setReason(reason);
        rr.setResolvedAt(LocalDateTime.now());
        rr.setResolvedBy(adminId);
        returnRequestRepository.save(rr);
        return toReturnResponse(rr, returnItemRepository.findByReturnRequestId(returnId));
    }

    @Transactional
    public ReturnRequestResponse confirmRefund(Long returnId, BigDecimal refundAmount, Long adminId) {
        ReturnRequest rr = getReturnOr404(returnId);
        if (rr.getStatus() != ReturnStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "can only refund an APPROVED return");
        }
        rr.setStatus(ReturnStatus.REFUNDED);
        rr.setRefundAmount(refundAmount);
        rr.setResolvedAt(LocalDateTime.now());
        rr.setResolvedBy(adminId);
        returnRequestRepository.save(rr);
        return toReturnResponse(rr, returnItemRepository.findByReturnRequestId(returnId));
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OrderAnalyticsResponse getAnalytics(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findByCreatedAtBetween(fromDt, toDt);
        long totalOrders = orders.size();
        BigDecimal totalRevenue = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        Map<String, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));

        List<ReturnRequest> returns = returnRequestRepository.findByRequestedAtBetween(fromDt, toDt);
        long totalReturns = returns.size();
        double returnRate = totalOrders > 0
                ? Math.round((double) totalReturns / totalOrders * 10000.0) / 100.0 : 0;

        OrderAnalyticsResponse r = new OrderAnalyticsResponse();
        r.setTotalOrders(totalOrders);
        r.setTotalRevenue(totalRevenue);
        r.setAvgOrderValue(avgOrderValue);
        r.setOrdersByStatus(ordersByStatus);
        r.setTotalReturns(totalReturns);
        r.setReturnRate(returnRate);
        return r;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ReturnRequest getReturnOr404(Long returnId) {
        return returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "return not found: " + returnId));
    }

    private AdminOrderResponse toAdminOrderResponse(Order order, boolean includeItems) {
        AdminOrderResponse r = new AdminOrderResponse();
        r.setId(order.getId());
        r.setUserId(order.getUserId());
        userRepository.findById(order.getUserId()).ifPresent(u -> {
            r.setUsername(u.getUsername());
            r.setUserEmail(u.getEmail());
        });
        r.setStatus(order.getStatus().name());
        r.setTotalAmount(order.getTotalAmount());
        r.setCreatedAt(order.getCreatedAt());
        if (includeItems) {
            r.setItems(order.getItems().stream()
                    .map(this::toAdminOrderItemResponse)
                    .collect(Collectors.toList()));
        }
        return r;
    }

    private AdminOrderItemResponse toAdminOrderItemResponse(OrderItem item) {
        AdminOrderItemResponse r = new AdminOrderItemResponse();
        r.setProductId(item.getProductId());
        r.setProductName(item.getProductName());
        r.setUnitPrice(item.getUnitPrice());
        r.setQuantity(item.getQuantity());
        r.setLineTotal(item.getLineTotal());
        return r;
    }

    private ReturnRequestResponse toReturnResponse(ReturnRequest rr, List<ReturnItem> items) {
        ReturnRequestResponse r = new ReturnRequestResponse();
        r.setId(rr.getId());
        r.setOrderId(rr.getOrderId());
        r.setUserId(rr.getUserId());
        userRepository.findById(rr.getUserId()).ifPresent(u -> r.setUsername(u.getUsername()));
        r.setStatus(rr.getStatus().name());
        r.setReason(rr.getReason());
        r.setRefundAmount(rr.getRefundAmount());
        r.setRequestedAt(rr.getRequestedAt());
        r.setResolvedAt(rr.getResolvedAt());
        r.setResolvedBy(rr.getResolvedBy());
        r.setItems(items.stream().map(this::toReturnItemResponse).collect(Collectors.toList()));
        return r;
    }

    private ReturnItemResponse toReturnItemResponse(ReturnItem ri) {
        ReturnItemResponse r = new ReturnItemResponse();
        r.setId(ri.getId());
        r.setOrderItemId(ri.getOrderItemId());
        r.setProductId(ri.getProductId());
        r.setProductName(ri.getProductName());
        r.setQuantity(ri.getQuantity());
        return r;
    }
}

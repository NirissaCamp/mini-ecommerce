package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.CreateReturnRequest;
import com.guang.miniecommercebackend.dto.OrderDetailResponse;
import com.guang.miniecommercebackend.dto.OrderItemResponse;
import com.guang.miniecommercebackend.dto.OrderSummaryResponse;
import com.guang.miniecommercebackend.dto.ReturnItemRequest;
import com.guang.miniecommercebackend.dto.ReturnItemResponse;
import com.guang.miniecommercebackend.dto.ReturnRequestResponse;
import org.springframework.stereotype.Service;
import com.guang.miniecommercebackend.repository.OrderRepository;
import com.guang.miniecommercebackend.repository.ReturnItemRepository;
import com.guang.miniecommercebackend.repository.ReturnRequestRepository;
import com.guang.miniecommercebackend.repository.UserRepository;
import com.guang.miniecommercebackend.repository.CartRepository;
import com.guang.miniecommercebackend.repository.ProductRepository;
import com.guang.miniecommercebackend.entity.Order;
import com.guang.miniecommercebackend.entity.OrderItem;
import com.guang.miniecommercebackend.entity.OrderStatus;
import com.guang.miniecommercebackend.entity.Cart;
import com.guang.miniecommercebackend.entity.CartItem;
import com.guang.miniecommercebackend.entity.Product;
import com.guang.miniecommercebackend.entity.ReturnItem;
import com.guang.miniecommercebackend.entity.ReturnRequest;
import com.guang.miniecommercebackend.entity.ReturnStatus;
import com.guang.miniecommercebackend.entity.User;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final InventoryService inventoryService;
    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnItemRepository returnItemRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository,
                        CartRepository cartRepository, ProductRepository productRepository,
                        CartService cartService, InventoryService inventoryService,
                        ReturnRequestRepository returnRequestRepository,
                        ReturnItemRepository returnItemRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.cartService = cartService;
        this.inventoryService = inventoryService;
        this.returnRequestRepository = returnRequestRepository;
        this.returnItemRepository = returnItemRepository;
    }

    /**
     * 从当前用户购物车生成订单并保存；清空购物车。
     * 返回 OrderDetailResponse
     */
    @Transactional
    public OrderDetailResponse placeOrderFromCart(String username){
        User user = getUserByUsernameOr404(username);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "cart is empty"));

        if (cart.getItems().isEmpty()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cart is empty");
        }

//        // 先统一校验库存（与 CartService.validateStock 同思路）
//        for (CartItem item : cart.getItems()){
//            validateStock(item.getProduct(), item.getQuantity());
//        }

        //替换上面的一段，这里先锁商品，然后再校验
        //  1) 收集 id 并排序
        java.util.List<Long> productIds = cart.getItems().stream()
                .map(ci -> ci.getProduct().getId())
                .distinct()
                .sorted()
                .toList();
        //  2）对每个id findByIdForUpdate, 放进 Map
        Map<Long, Product> lockedById = new HashMap<>();
        for (Long productId : productIds) {
            Product p = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found"));
            lockedById.put(productId, p);
        }
        //组装 Order / OrderItem
        Order order = new Order();
        order.setUserId(user.getId());

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()){
            Long pid = cartItem.getProduct().getId();
            Product product = lockedById.get(pid);
            BigDecimal unitPrice = product.getPrice();
            int quantity = cartItem.getQuantity();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            OrderItem line = new OrderItem();
            line.setOrder(order);
            line.setProductId(product.getId());
            line.setProductName(product.getName());
            line.setUnitPrice(unitPrice);
            line.setQuantity(quantity);
            line.setLineTotal(lineTotal);
            order.getItems().add(line);
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setTotalAmount(totalAmount);

        Order saved = orderRepository.save(order);

        // Allocate inventory in sorted product-ID order (prevents deadlocks)
        for (Long productId : productIds) {
            int qty = cart.getItems().stream()
                    .filter(ci -> ci.getProduct().getId().equals(productId))
                    .mapToInt(CartItem::getQuantity)
                    .sum();
            //  checkout 时 allocate
            //
            //  用户下单（还没发货）时，把库存从 available 挪到 allocated
            //  目的是“锁货”，防止超卖
            //  不是实际出库
            inventoryService.allocate(productId, qty, saved.getId());
        }
        // 先扣库存再清空购物车
        cartService.clearCart(username);
        return toDetail(saved);
    }

    @Transactional
    public ReturnRequestResponse createReturn(String username, Long orderId,
                                              CreateReturnRequest req) {
        User user = getUserByUsernameOr404(username);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "order not found"));

        Set<OrderStatus> returnable = Set.of(
                OrderStatus.PAID, OrderStatus.PROCESSING,
                OrderStatus.SHIPPED, OrderStatus.DELIVERED
        );
        if (!returnable.contains(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "returns are only allowed for this order status");
        }
        // Prevent duplicate active (non-rejected) return requests
        List<ReturnRequest> existing = returnRequestRepository
                .findByOrderIdAndStatus(orderId, ReturnStatus.REQUESTED);
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "a return request already pending for this order");
        }
        // Calculate already-approved returned quantities per orderItemId
        Map<Long, Integer> approvedReturnedQty = new HashMap<>();
        List<ReturnRequest> approvedReturns = returnRequestRepository
                .findByOrderIdAndStatus(orderId, ReturnStatus.APPROVED);
        for (ReturnRequest approved : approvedReturns) {
            for (ReturnItem ai : returnItemRepository.findByReturnRequestId(approved.getId())) {
                approvedReturnedQty.merge(ai.getOrderItemId(), ai.getQuantity(), Integer::sum);
            }
        }
        ReturnRequest rr = new ReturnRequest();
        rr.setOrderId(orderId);
        rr.setUserId(user.getId());
        rr.setReason(req.getReason());
        ReturnRequest saved = returnRequestRepository.save(rr);

        for (ReturnItemRequest itemReq : req.getItems()) {
            OrderItem oi = order.getItems().stream()
                    .filter(i -> i.getId().equals(itemReq.getOrderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "order item not found: " + itemReq.getOrderItemId()));
            // Quantity validation
            int alreadyReturned = approvedReturnedQty.getOrDefault(oi.getId(), 0);
            int remaining = oi.getQuantity() - alreadyReturned;
            if (itemReq.getQuantity() < 1 || itemReq.getQuantity() > remaining) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "return quantity for '" + oi.getProductName() + "' exceeds returnable amount (" + remaining +
                                "remaining)");
            }
            ReturnItem ri = new ReturnItem();
            ri.setReturnRequestId(saved.getId());
            ri.setOrderItemId(oi.getId());
            ri.setProductId(oi.getProductId());
            ri.setProductName(oi.getProductName());
            ri.setQuantity(itemReq.getQuantity());
            returnItemRepository.save(ri);
        }
        List<ReturnItem> savedItems = returnItemRepository.findByReturnRequestId(saved.getId());
        return toReturnResponse(saved, savedItems, user.getUsername());
    }

    //单条订单详情
    @Transactional(readOnly = true)
    public  OrderDetailResponse getMyOrder(String username, Long orderId) {
        User user = getUserByUsernameOr404(username);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "order not found"));
        return toDetail(order);
    }

    //订单列表
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> listMyOrders(String username, OrderStatus status){
        User user = getUserByUsernameOr404(username);
        List<Order> orders;
        if (status == null) {
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        } else {
            orders = orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status);
        }

        return orders.stream().map(this::toSummary).toList();
    }

    private ReturnRequestResponse toReturnResponse(ReturnRequest rr,
                                                   List<ReturnItem> items,
                                                   String username) {
        ReturnRequestResponse r = new ReturnRequestResponse();
        r.setId(rr.getId());
        r.setOrderId(rr.getOrderId());
        r.setUserId(rr.getUserId());
        r.setUsername(username);
        r.setStatus(rr.getStatus().name());
        r.setReason(rr.getReason());
        r.setRefundAmount(rr.getRefundAmount());
        r.setRequestedAt(rr.getRequestedAt());
        r.setResolvedAt(rr.getResolvedAt());
        r.setResolvedBy(rr.getResolvedBy());
        r.setItems(items.stream().map(ri -> {
            ReturnItemResponse resp = new ReturnItemResponse();
            resp.setId(ri.getId());
            resp.setOrderItemId(ri.getOrderItemId());
            resp.setProductId(ri.getProductId());
            resp.setProductName(ri.getProductName());
            resp.setQuantity(ri.getQuantity());
            return resp;
        }).collect(Collectors.toList()));
        return r;
    }

    private User getUserByUsernameOr404(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
    }

//    私有映射方法 = 集中写「实体 → DTO」的规则，Service 对外只返回 DTO。

    //一个 OrderItem → 一个 OrderItemResponse
    private OrderItemResponse toOrderItemResponse (OrderItem item){
        return new OrderItemResponse(
                item.getId(),
                item.getProductId(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }

    //写 toSummary


    private OrderSummaryResponse toSummary(Order o){
        List<ReturnRequest> returns = returnRequestRepository.findByOrderId(o.getId());

        String returnStatus = null;
        if (returns.stream().anyMatch(r -> r.getStatus() == ReturnStatus.REQUESTED)) {
            returnStatus = "REQUESTED";
        } else if (returns.stream().anyMatch(r -> r.getStatus() == ReturnStatus.APPROVED)) {
            returnStatus = "APPROVED";
        } else if (returns.stream().anyMatch(r -> r.getStatus() == ReturnStatus.REFUNDED)) {
            returnStatus = "REFUNDED";
        } else if (returns.stream().anyMatch(r -> r.getStatus() == ReturnStatus.REJECTED)) {
            returnStatus = "REJECTED";
        }
        return new OrderSummaryResponse(
                o.getId(),
                o.getTotalAmount(),
                o.getStatus().name(),
                o.getCreatedAt(),
                returnStatus
        );
    }

    //写 toDetail
    private OrderDetailResponse toDetail(Order o){
        OrderDetailResponse resp = new OrderDetailResponse(
                o.getId(),
                o.getTotalAmount(),
                o.getStatus().name(),
                o.getCreatedAt(),
                o.getItems().stream().map(this::toOrderItemResponse).toList()
        );
        List<ReturnRequest> returns = returnRequestRepository.findByOrderId(o.getId());
        List<ReturnRequestResponse> returnResponses = returns.stream().map(rr -> {
            List<ReturnItem> ritems = returnItemRepository.findByReturnRequestId(rr.getId());
            return toReturnResponse(rr, ritems, null);
        }).toList();
        resp.setReturnRequests(returnResponses);
        return resp;
    }

    @Transactional
    public OrderDetailResponse payOrder(String username, Long orderId) {
        User user = getUserByUsernameOr404(username);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not in PENDING status");
        }
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        return getMyOrder(username, orderId);
    }
}
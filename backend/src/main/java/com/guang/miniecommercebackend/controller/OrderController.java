package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.entity.OrderStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.guang.miniecommercebackend.service.OrderService;
import com.guang.miniecommercebackend.dto.CreateReturnRequest;
import com.guang.miniecommercebackend.dto.OrderDetailResponse;
import com.guang.miniecommercebackend.dto.OrderSummaryResponse;
import com.guang.miniecommercebackend.dto.ReturnRequestResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService){
        this.orderService = orderService;
    }

    //  订单列表 - GET /api/orders
    @GetMapping
    public List<OrderSummaryResponse> getOrders(Authentication auth,
                                                @RequestParam(required = false) String status){
        String username = (String) auth.getPrincipal();

        OrderStatus orderStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                orderStatus = OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status: " + status);
            }
        }

        return orderService.listMyOrders(username, orderStatus);
    }

    //  订单详情 — GET /api/orders/{orderId}
    @GetMapping("/{orderId}")
    public OrderDetailResponse getOrderDetail(Authentication auth, @PathVariable("orderId") Long orderId){
        String username = (String) auth.getPrincipal();
        return orderService.getMyOrder(username, orderId);
    }

    // Create return request — POST /api/orders/{orderId}/returns
    @PostMapping("/{orderId}/returns")
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnRequestResponse createReturn(
            Authentication auth,
            @PathVariable Long orderId,
            @Valid @RequestBody CreateReturnRequest req) {
        String username = (String) auth.getPrincipal();
        return orderService.createReturn(username, orderId, req);
    }

    // Pay order — POST /api/orders/{orderId}/pay
    @PostMapping("/{orderId}/pay")
    public OrderDetailResponse payOrder(Authentication auth, @PathVariable Long orderId) {
        String username = (String) auth.getPrincipal();
        return orderService.payOrder(username, orderId);
    }
}

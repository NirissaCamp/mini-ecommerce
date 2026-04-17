package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.OrderDetailResponse;
import com.guang.miniecommercebackend.dto.OrderItemResponse;
import com.guang.miniecommercebackend.dto.OrderSummaryResponse;
import org.springframework.stereotype.Service;
import com.guang.miniecommercebackend.repository.OrderRepository;
import com.guang.miniecommercebackend.repository.UserRepository;
import com.guang.miniecommercebackend.repository.CartRepository;
import com.guang.miniecommercebackend.repository.ProductRepository;
import com.guang.miniecommercebackend.entity.Order;
import com.guang.miniecommercebackend.entity.OrderItem;
import com.guang.miniecommercebackend.entity.Cart;
import com.guang.miniecommercebackend.entity.CartItem;
import com.guang.miniecommercebackend.entity.Product;
import com.guang.miniecommercebackend.entity.User;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final InventoryService inventoryService;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, CartRepository cartRepository, ProductRepository productRepository, CartService cartService, InventoryService inventoryService){
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.cartService = cartService;
        this.inventoryService = inventoryService;
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
            inventoryService.allocate(productId, qty, saved.getId());
        }
        // 先扣库存再清空购物车
        cartService.clearCart(username);
        return toDetail(saved);
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
    public List<OrderSummaryResponse> listMyOrders(String username){
        User user = getUserByUsernameOr404(username);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toSummary).toList();
    }

    private User getUserByUsernameOr404(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
    }

//    私有映射方法 = 集中写「实体 → DTO」的规则，Service 对外只返回 DTO。

    //一个 OrderItem → 一个 OrderItemResponse
    private OrderItemResponse toOrderItemResponse (OrderItem item){
        return new OrderItemResponse(
                item.getProductId(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }

    //写 toSummary
    private OrderSummaryResponse toSummary(Order o){
        return new OrderSummaryResponse(
                o.getId(),
                o.getTotalAmount(),
                o.getStatus().name(),
                o.getCreatedAt()
        );
    }

    //写 toDetail
    private OrderDetailResponse toDetail(Order o){
        return new OrderDetailResponse(
                o.getId(),
                o.getTotalAmount(),
                o.getStatus().name(),
                o.getCreatedAt(),
                o.getItems().stream().map(this::toOrderItemResponse).toList()
        );
    }

}

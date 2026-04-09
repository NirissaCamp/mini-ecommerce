package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.repository.CartRepository;
import com.guang.miniecommercebackend.repository.CartItemRepository;
import com.guang.miniecommercebackend.repository.ProductRepository;
import com.guang.miniecommercebackend.repository.UserRepository;
import com.guang.miniecommercebackend.repository.ProductImageRepository;
import com.guang.miniecommercebackend.dto.CartResponse;
import com.guang.miniecommercebackend.dto.CartItemResponse;
import com.guang.miniecommercebackend.dto.AddToCartRequest;
import com.guang.miniecommercebackend.dto.UpdateCartItemRequest;
import com.guang.miniecommercebackend.entity.Cart;
import com.guang.miniecommercebackend.entity.CartItem;
import com.guang.miniecommercebackend.entity.Product;
import com.guang.miniecommercebackend.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final ProductImageRepository productImageRepository;

    public CartService(UserRepository userRepository, ProductRepository productRepository,
                       CartItemRepository cartItemRepository, CartRepository cartRepository,
                       ProductImageRepository productImageRepository){
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartItemRepository = cartItemRepository;
        this.cartRepository = cartRepository;
        this.productImageRepository = productImageRepository;
    }

    // ─────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────

    /**
     * Return the current user's cart.
     * Creates an empty cart if this is the first call for this user.
     * 返回当前用户的购物车；若不存在则自动创建。
     */
    @Transactional
    public  CartResponse getCart(String username){
        Cart cart = getOrCreateCart(username);
        return toResponse(cart);
    }
    /**
     * Add a product to the cart.
     * - If the product is already in the cart, quantities are merged.
     * - Stock is checked against the final combined quantity.
     * 将商品加入购物车；已存在则合并数量，并校验库存。
     */
    @Transactional
    public CartResponse addItem(String username,AddToCartRequest req){
        Cart cart = getOrCreateCart(username);
        Product product = productRepository.findByIdAndActiveTrue(req.getProductId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found"));
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(),product.getId())
                .orElseGet(()->{
                    CartItem newItem = new CartItem();
                    newItem.setCart(cart);
                    newItem.setProduct(product);
                    newItem.setQuantity(0); // will be updated below
                    cart.getItems().add(newItem);
                    return newItem;
                });
        int newQuantity = item.getQuantity() + req.getQuantity();
        validateStock(product, newQuantity);
        item.setQuantity(newQuantity);
        cartRepository.save(cart);
        return toResponse(cart);
    }

    /**
     * Overwrite the quantity of an existing cart item.
     * Throws 404 if the product is not in the cart.
     * 直接设置已有商品的数量；商品不在购物车中则返回 404。
     */
    @Transactional
    public CartResponse updateItem(String username, Long productId, UpdateCartItemRequest req){
        Cart cart = getOrCreateCart(username);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(()->new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "item not in cart"
                ));
        validateStock(item.getProduct(), req.getQuantity());
        item.setQuantity(req.getQuantity());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    /**
     * Remove a single product line from the cart.
     * Throws 404 if the product is not in the cart.
     * 从购物车移除指定商品行；不存在则返回 404。
     */
    @Transactional
    public CartResponse removeItem(String username, Long productId) {
        Cart cart = getOrCreateCart(username);

        CartItem item = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "item not in cart"));

        cart.getItems().remove(item);// orphanRemoval = true handles DELETE
        cartRepository.save(cart);
        return  toResponse(cart);
    }

    /**
     * Delete all items from the cart. The cart row itself is kept.
     * 清空购物车中所有商品行，保留购物车记录本身。
     */
    @Transactional
    public void clearCart(String username) {
        Cart cart = getOrCreateCart(username);
        cart.getItems().clear();          // orphanRemoval = true handles bulk DELETE
        cartRepository.save(cart);
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    /**
     * Resolve username → userId → Cart.
     * Creates and persists a new Cart if the user has none yet.
     * 通过用户名找到 userId，再找或创建购物车。
     */
    private Cart getOrCreateCart(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "user not found"));

        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUserId(user.getId());
                    return cartRepository.save(newCart);});
    }

    /**
     * Guard: requested quantity must not exceed available stock.
     * 库存校验：请求数量不得超过当前库存。
     */
    private void validateStock(Product product, int requestedQty){
        if (product.getStock() < requestedQty){
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "insufficient stock for product:" + product.getName());
        }
    }

    /**
     * Convert a Cart entity to CartResponse DTO.
     * Computes per-item subtotal and the overall total.
     * 将 Cart 实体转换为 CartResponse DTO，计算小计和总计。
     */
    private CartResponse toResponse(Cart cart){
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(item -> {
                    String imageUrl = productImageRepository
                            .findByProductIdOrderBySortOrderAsc(item.getProduct().getId())
                            .stream()
                            .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                            .findFirst()
                            .map(img -> img.getImageUrl())
                            .orElse(null);
                    return new CartItemResponse(
                            item.getProduct().getId(),
                            item.getProduct().getName(),
                            item.getProduct().getPrice(),
                            item.getQuantity(),
                            item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())),
                            imageUrl);
                }).toList();
        BigDecimal total = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int itemCount = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity).sum();
        return  new CartResponse(cart.getId(),itemResponses, total, itemCount);
    }
}

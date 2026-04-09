package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.ShippingOptionRequest;
import com.guang.miniecommercebackend.dto.ShippingOptionResponse;
import com.guang.miniecommercebackend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products/{productId}/shipping")
public class AdminShippingOptionController {
    private final ProductService productService;

    public AdminShippingOptionController(ProductService productService) {
        this.productService = productService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ShippingOptionResponse> addShipping(
            @PathVariable Long productId,
            @Valid @RequestBody ShippingOptionRequest req) {
        ShippingOptionResponse created = productService.addShipping(productId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{shippingId}")
    public ResponseEntity<Void> deleteShipping(
            @PathVariable Long productId,
            @PathVariable Long shippingId) {
        productService.deleteShipping(productId, shippingId);
        return ResponseEntity.noContent().build();
    }
}

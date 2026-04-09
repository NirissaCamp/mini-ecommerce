package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.ProductBulletRequest;
import com.guang.miniecommercebackend.dto.ProductBulletResponse;
import com.guang.miniecommercebackend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products/{productId}/bullets")
public class AdminProductBulletController {

    private final ProductService productService;

    public AdminProductBulletController(ProductService productService) {
        this.productService = productService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    public ResponseEntity<ProductBulletResponse> saveBullet(
            @PathVariable Long productId,
            @Valid @RequestBody ProductBulletRequest req) {
        ProductBulletResponse saved = productService.saveBullet(productId, req);
        return ResponseEntity.ok(saved);
    }
}

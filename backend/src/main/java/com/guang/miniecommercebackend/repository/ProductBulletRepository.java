package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.ProductBullet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductBulletRepository extends JpaRepository<ProductBullet, Long> {
    Optional<ProductBullet> findByProductId(Long productId);
}

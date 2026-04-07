package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.ProductBullet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductBulletRepository extends JpaRepository<ProductBullet, Long> {
    List<ProductBullet> findByProductIdOrderBySortOrderAsc(Long productId);
}

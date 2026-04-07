package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.ShippingOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingOptionRepository extends JpaRepository<ShippingOption, Long> {
    List<ShippingOption> findByProductId(Long productId);
}

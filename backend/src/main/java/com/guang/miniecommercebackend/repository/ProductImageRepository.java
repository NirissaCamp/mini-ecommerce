package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long>  {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    @Transactional
    void deleteByProductId(Long productId);
}


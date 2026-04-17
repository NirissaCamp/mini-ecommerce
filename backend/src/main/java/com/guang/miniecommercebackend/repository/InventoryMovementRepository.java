package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.InventoryMovement;
import com.guang.miniecommercebackend.entity.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    Page<InventoryMovement> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(m.qtyChange * m.unitCost), 0) FROM InventoryMovement m " +
           "WHERE m.productId = :productId AND m.movementType = :type")
    BigDecimal sumWeightedCost(@Param("productId") Long productId,
                               @Param("type") MovementType type);

    @Query("SELECT COALESCE(SUM(m.qtyChange), 0) FROM InventoryMovement m " +
           "WHERE m.productId = :productId AND m.movementType = :type")
    Integer sumQtyByType(@Param("productId") Long productId,
                         @Param("type") MovementType type);
}

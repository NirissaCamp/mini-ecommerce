package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.AdminOperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdminOperationLogRepository extends JpaRepository<AdminOperationLog, Long> {

    List<AdminOperationLog> findByTargetUserIdOrderByCreatedAtDesc(Long userId);

    List<AdminOperationLog> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("UPDATE AdminOperationLog l SET l.targetUser = null WHERE l.targetUser.id = :userId")
    void clearTargetUser(@Param("userId") Long userId);
}

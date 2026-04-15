package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.AdminOperationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminOperationLogRepository extends JpaRepository<AdminOperationLog, Long> {

    List<AdminOperationLog> findByTargetUserIdOrderByCreatedAtDesc(Long userId);

    List<AdminOperationLog> findAllByOrderByCreatedAtDesc();
}

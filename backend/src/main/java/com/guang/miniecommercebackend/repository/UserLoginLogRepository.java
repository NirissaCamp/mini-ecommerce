package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.UserLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserLoginLogRepository extends JpaRepository<UserLoginLog, Long> {

    List<UserLoginLog> findByUserIdOrderByLoginTimeDesc(Long userId);

    List<UserLoginLog> findByUserIdAndSuccessFlagOrderByLoginTimeDesc(Long userId, Boolean successFlag);

    List<UserLoginLog> findAllByOrderByLoginTimeDesc();
}

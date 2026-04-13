package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.UserBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBlacklistRepository extends JpaRepository<UserBlacklist, Long> {

    List<UserBlacklist> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserId(Long userId);

    void deleteByUserId(Long userId);
}

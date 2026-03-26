package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByUsername(String username);
}

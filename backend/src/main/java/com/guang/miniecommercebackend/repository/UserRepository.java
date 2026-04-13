package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByStatus(User.UserStatus status);

    List<User> findByUsernameContainingIgnoreCase(String username);
}

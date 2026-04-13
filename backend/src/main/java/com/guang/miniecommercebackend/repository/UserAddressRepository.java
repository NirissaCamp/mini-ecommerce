package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUserId(Long userId);

    Optional<UserAddress> findByUserIdAndIsDefaultTrue(Long userId);

    void deleteByUserId(Long userId);
}

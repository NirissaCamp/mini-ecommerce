package com.guang.miniecommercebackend.repository;

import com.guang.miniecommercebackend.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByPermissionCode(String permissionCode);

    boolean existsByPermissionCode(String permissionCode);
}

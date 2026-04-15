package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.RoleResponse;
import com.guang.miniecommercebackend.dto.UserResponse;
import com.guang.miniecommercebackend.service.AdminUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoleController {

    private final AdminUserService adminUserService;

    public AdminRoleController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /** GET /api/admin/roles */
    @GetMapping
    public List<RoleResponse> listRoles() {
        return adminUserService.listRoles();
    }

    /** POST /api/admin/roles  Body: { "roleName": "ROLE_X", "description": "..." } */
    @PostMapping
    public ResponseEntity<RoleResponse> createRole(@RequestBody Map<String, String> body) {
        String roleName = body.get("roleName");
        String description = body.get("description");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createRole(roleName, description));
    }

    /** PUT /api/admin/roles/{id}  Body: { "roleName": "...", "description": "..." } */
    @PutMapping("/{id}")
    public RoleResponse updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return adminUserService.updateRole(id, body.get("roleName"), body.get("description"));
    }

    /** DELETE /api/admin/roles/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        adminUserService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/admin/roles/{roleId}/users/{userId} */
    @PostMapping("/{roleId}/users/{userId}")
    public RoleResponse addUserToRole(@PathVariable Long roleId, @PathVariable Long userId) {
        return adminUserService.addUserToRole(roleId, userId);
    }

    /** DELETE /api/admin/roles/{roleId}/users/{userId} */
    @DeleteMapping("/{roleId}/users/{userId}")
    public RoleResponse removeUserFromRole(@PathVariable Long roleId, @PathVariable Long userId) {
        return adminUserService.removeUserFromRole(roleId, userId);
    }

    /** POST /api/admin/roles/{roleId}/permissions/{permissionCode} */
    @PostMapping("/{roleId}/permissions/{permissionCode}")
    public RoleResponse addPermission(@PathVariable Long roleId, @PathVariable String permissionCode) {
        return adminUserService.addPermissionToRole(roleId, permissionCode);
    }

    /** DELETE /api/admin/roles/{roleId}/permissions/{permissionCode} */
    @DeleteMapping("/{roleId}/permissions/{permissionCode}")
    public RoleResponse removePermission(@PathVariable Long roleId, @PathVariable String permissionCode) {
        return adminUserService.removePermissionFromRole(roleId, permissionCode);
    }
}

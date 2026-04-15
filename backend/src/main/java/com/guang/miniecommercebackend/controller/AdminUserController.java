package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.*;
import com.guang.miniecommercebackend.entity.User;
import com.guang.miniecommercebackend.entity.UserBlacklist;
import com.guang.miniecommercebackend.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * GET /api/admin/users
     * GET /api/admin/users?keyword=john          → search by username
     * GET /api/admin/users?status=BANNED         → filter by status
     */
    @GetMapping
    public List<UserResponse> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) User.UserStatus status) {

        if (keyword != null && !keyword.isBlank()) {
            return adminUserService.searchByUsername(keyword);
        }
        if (status != null) {
            return adminUserService.listByStatus(status);
        }
        return adminUserService.listAllUsers();
    }

    /**
     * GET /api/admin/users/{id}
     */
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return adminUserService.getUserById(id);
    }

    /**
     * POST /api/admin/users
     * Body: { username, password, email, phone, levelId, roleNames }
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreateRequest req) {
        UserResponse created = adminUserService.createUser(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/admin/users/{id}
     * Body: { email, phone, status, levelId, roleNames }  — all optional
     */
    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req) {
        return adminUserService.updateUser(id, req);
    }

    /**
     * DELETE /api/admin/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ===== Blacklist =====

    /**
     * POST /api/admin/users/{id}/blacklist
     * Body: { reason }  → bans the user and records the reason
     */
    @PostMapping("/{id}/blacklist")
    public UserResponse blacklistUser(@PathVariable Long id, @RequestBody BlacklistRequest req) {
        return adminUserService.blacklistUser(id, req);
    }

    /**
     * DELETE /api/admin/users/{id}/blacklist
     * Removes all blacklist entries and restores status to ACTIVE
     */
    @DeleteMapping("/{id}/blacklist")
    public UserResponse removeFromBlacklist(@PathVariable Long id) {
        return adminUserService.removeFromBlacklist(id);
    }

    /**
     * GET /api/admin/users/{id}/blacklist
     * Returns the full blacklist history for this user
     */
    @GetMapping("/{id}/blacklist")
    public List<UserBlacklist> getBlacklistEntries(@PathVariable Long id) {
        return adminUserService.getUserBlacklistEntries(id);
    }

    // ===== Sub-resources =====

    /**
     * GET /api/admin/users/{id}/addresses
     */
    @GetMapping("/{id}/addresses")
    public List<UserAddressResponse> getAddresses(@PathVariable Long id) {
        return adminUserService.getUserAddresses(id);
    }

    /**
     * GET /api/admin/users/{id}/login-logs
     */
    @GetMapping("/{id}/login-logs")
    public List<UserLoginLogResponse> getLoginLogs(@PathVariable Long id) {
        return adminUserService.getUserLoginLogs(id);
    }

    /**
     * GET /api/admin/users/{id}/operation-logs
     */
    @GetMapping("/{id}/operation-logs")
    public List<AdminOperationLogResponse> getOperationLogs(@PathVariable Long id) {
        return adminUserService.getOperationLogs(id);
    }

    /**
     * GET /api/admin/operation-logs  — global, all users
     */
    @GetMapping("/operation-logs")
    public List<AdminOperationLogResponse> getAllOperationLogs() {
        return adminUserService.getAllOperationLogs();
    }

    /**
     * GET /api/admin/login-logs  — global login logs
     */
    @GetMapping("/login-logs")
    public List<UserLoginLogResponse> getAllLoginLogs() {
        return adminUserService.getAllLoginLogs();
    }

    /**
     * GET /api/admin/users/blacklist  — all blacklist entries
     */
    @GetMapping("/blacklist")
    public List<UserBlacklistResponse> getAllBlacklist() {
        return adminUserService.getAllBlacklistEntries();
    }
}

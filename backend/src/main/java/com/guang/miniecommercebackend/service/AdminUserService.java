package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.*;
import com.guang.miniecommercebackend.entity.*;
import com.guang.miniecommercebackend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserAddressRepository userAddressRepository;
    private final UserLoginLogRepository userLoginLogRepository;
    private final UserBlacklistRepository userBlacklistRepository;
    private final AdminOperationLogRepository operationLogRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepository,
                            RoleRepository roleRepository,
                            PermissionRepository permissionRepository,
                            UserAddressRepository userAddressRepository,
                            UserLoginLogRepository userLoginLogRepository,
                            UserBlacklistRepository userBlacklistRepository,
                            AdminOperationLogRepository operationLogRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userAddressRepository = userAddressRepository;
        this.userLoginLogRepository = userLoginLogRepository;
        this.userBlacklistRepository = userBlacklistRepository;
        this.operationLogRepository = operationLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ===== User list & search =====

    public List<UserResponse> listAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UserResponse> searchByUsername(String keyword) {
        return userRepository.findByUsernameContainingIgnoreCase(keyword).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UserResponse> listByStatus(User.UserStatus status) {
        return userRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    // ===== Single user =====

    public UserResponse getUserById(Long id) {
        return toResponse(getByIdOr404(id));
    }

    // ===== Create =====

    @Transactional
    public UserResponse createUser(UserCreateRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username already exists");
        }
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email already in use");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setLevelId(req.getLevelId());
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRoles(resolveRoles(req.getRoleNames()));

        User saved = userRepository.save(user);
        log(saved, AdminOperationLog.ActionType.CREATE, "User created: " + saved.getUsername());
        return toResponse(saved);
    }

    // ===== Update =====

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest req) {
        User user = getByIdOr404(id);

        if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email already in use");
        }

        if (req.getEmail() != null)   user.setEmail(req.getEmail());
        if (req.getPhone() != null)   user.setPhone(req.getPhone());
        if (req.getStatus() != null)  user.setStatus(req.getStatus());
        if (req.getLevelId() != null) user.setLevelId(req.getLevelId());
        if (req.getRoleNames() != null) user.setRoles(resolveRoles(req.getRoleNames()));

        User saved = userRepository.save(user);
        log(saved, AdminOperationLog.ActionType.UPDATE, "User updated: " + saved.getUsername());
        return toResponse(saved);
    }

    // ===== Delete =====

    @Transactional
    public void deleteUser(Long id) {
        User user = getByIdOr404(id);
        log(user, AdminOperationLog.ActionType.DELETE, "User deleted: " + user.getUsername());
        userRepository.delete(user);
    }

    // ===== Blacklist =====

    @Transactional
    public UserResponse blacklistUser(Long id, BlacklistRequest req) {
        User user = getByIdOr404(id);

        String operator = SecurityContextHolder.getContext().getAuthentication().getName();
        UserBlacklist entry = new UserBlacklist();
        entry.setUser(user);
        entry.setReason(req.getReason());
        entry.setBannedBy(operator);
        userBlacklistRepository.save(entry);

        user.setStatus(User.UserStatus.BANNED);
        User saved = userRepository.save(user);
        log(saved, AdminOperationLog.ActionType.BLACKLIST, "Blacklisted. Reason: " + req.getReason());
        return toResponse(saved);
    }

    @Transactional
    public UserResponse removeFromBlacklist(Long id) {
        User user = getByIdOr404(id);
        userBlacklistRepository.deleteByUserId(id);
        user.setStatus(User.UserStatus.ACTIVE);
        User saved = userRepository.save(user);
        log(saved, AdminOperationLog.ActionType.UNBLACKLIST, "Removed from blacklist");
        return toResponse(saved);
    }

    // ===== Sub-resource queries =====

    public List<UserAddressResponse> getUserAddresses(Long id) {
        getByIdOr404(id);
        return userAddressRepository.findByUserId(id).stream()
                .map(a -> new UserAddressResponse(
                        a.getId(), a.getReceiverName(), a.getReceiverPhone(),
                        a.getState(), a.getCity(), a.getDistrict(),
                        a.getDetailAddress(), a.getIsDefault(), a.getCreatedAt()))
                .toList();
    }

    public List<UserLoginLogResponse> getUserLoginLogs(Long id) {
        getByIdOr404(id);
        return userLoginLogRepository.findByUserIdOrderByLoginTimeDesc(id).stream()
                .map(l -> new UserLoginLogResponse(
                        l.getId(), l.getUser().getUsername(), l.getLoginIp(), l.getDeviceInfo(),
                        l.getLoginTime(), l.getSuccessFlag()))
                .toList();
    }

    public List<UserBlacklist> getUserBlacklistEntries(Long id) {
        getByIdOr404(id);
        return userBlacklistRepository.findByUserIdOrderByCreatedAtDesc(id);
    }

    public List<UserBlacklistResponse> getAllBlacklistEntries() {
        return userBlacklistRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(b -> new UserBlacklistResponse(
                        b.getId(),
                        b.getUser().getId(),
                        b.getUser().getUsername(),
                        b.getUser().getStatus(),
                        b.getReason(),
                        b.getBannedBy(),
                        b.getCreatedAt()))
                .toList();
    }

    public List<UserLoginLogResponse> getAllLoginLogs() {
        return userLoginLogRepository.findAllByOrderByLoginTimeDesc().stream()
                .map(l -> new UserLoginLogResponse(
                        l.getId(), l.getUser().getUsername(), l.getLoginIp(), l.getDeviceInfo(),
                        l.getLoginTime(), l.getSuccessFlag()))
                .toList();
    }

    // ===== Operation logs =====

    public List<AdminOperationLogResponse> getOperationLogs(Long userId) {
        getByIdOr404(userId);
        return operationLogRepository.findByTargetUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toLogResponse).toList();
    }

    public List<AdminOperationLogResponse> getAllOperationLogs() {
        return operationLogRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toLogResponse).toList();
    }

    // ===== Roles =====

    public List<RoleResponse> listRoles() {
        return roleRepository.findAll().stream().map(this::toRoleResponse).toList();
    }

    @Transactional
    public RoleResponse addPermissionToRole(Long roleId, String permissionCode) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "role not found"));
        Permission permission = permissionRepository.findByPermissionCode(permissionCode)
                .orElseGet(() -> {
                    Permission p = new Permission();
                    p.setPermissionCode(permissionCode);
                    p.setPermissionName(permissionCode);
                    return permissionRepository.save(p);
                });
        role.getPermissions().add(permission);
        return toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse removePermissionFromRole(Long roleId, String permissionCode) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "role not found"));
        role.getPermissions().removeIf(p -> p.getPermissionCode().equals(permissionCode));
        return toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse createRole(String roleName, String description) {
        if (roleRepository.existsByRoleName(roleName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role already exists: " + roleName);
        }
        Role role = new Role();
        role.setRoleName(roleName);
        role.setDescription(description);
        return toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse updateRole(Long id, String roleName, String description) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "role not found"));
        if (roleName != null && !roleName.isBlank()) {
            if (!roleName.equals(role.getRoleName()) && roleRepository.existsByRoleName(roleName)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role name already exists: " + roleName);
            }
            role.setRoleName(roleName);
        }
        if (description != null) role.setDescription(description);
        return toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "role not found"));
        if (!role.getUsers().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete role with assigned users. Remove all users first.");
        }
        roleRepository.delete(role);
    }

    @Transactional
    public RoleResponse addUserToRole(Long roleId, Long userId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "role not found"));
        User user = getByIdOr404(userId);
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot assign a role to a banned user: " + user.getUsername());
        }
        user.getRoles().add(role);
        role.getUsers().add(user);
        userRepository.save(user);
        return toRoleResponse(role);
    }

    @Transactional
    public RoleResponse removeUserFromRole(Long roleId, Long userId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "role not found"));
        User user = getByIdOr404(userId);
        user.getRoles().remove(role);
        role.getUsers().remove(user);
        userRepository.save(user);
        return toRoleResponse(role);
    }

    // ===== Helpers =====

    private User getByIdOr404(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return new HashSet<>(Set.of(
                    roleRepository.findByRoleName("ROLE_USER")
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.INTERNAL_SERVER_ERROR, "default role ROLE_USER not found"))
            ));
        }
        return roleNames.stream()
                .map(name -> roleRepository.findByRoleName(name)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "role not found: " + name)))
                .collect(Collectors.toSet());
    }

    private void log(User target, AdminOperationLog.ActionType action, String detail) {
        String operator = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminOperationLog entry = new AdminOperationLog();
        entry.setTargetUser(target);
        entry.setOperatorUsername(operator);
        entry.setAction(action);
        entry.setDetail(detail);
        operationLogRepository.save(entry);
    }

    private AdminOperationLogResponse toLogResponse(AdminOperationLog l) {
        return new AdminOperationLogResponse(
                l.getId(),
                l.getTargetUser() != null ? l.getTargetUser().getId() : null,
                l.getTargetUser() != null ? l.getTargetUser().getUsername() : "—",
                l.getOperatorUsername(), l.getAction(), l.getDetail(), l.getCreatedAt());
    }

    private RoleResponse toRoleResponse(Role r) {
        List<UserSummaryResponse> users = r.getUsers().stream()
                .map(u -> new UserSummaryResponse(u.getId(), u.getUsername()))
                .toList();
        return new RoleResponse(
                r.getId(), r.getRoleName(), r.getDescription(),
                users.size(), users,
                r.getPermissions().stream()
                        .map(p -> new PermissionResponse(p.getId(), p.getPermissionCode(), p.getPermissionName()))
                        .toList());
    }

    private UserResponse toResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());
        boolean blacklisted = userBlacklistRepository.existsByUserId(user.getId());
        return new UserResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getPhone(),
                user.getStatus(), user.getLevelId(), roleNames,
                blacklisted, user.getCreatedAt(), user.getUpdatedAt());
    }
}

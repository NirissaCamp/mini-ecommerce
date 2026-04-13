package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.*;
import com.guang.miniecommercebackend.entity.*;
import com.guang.miniecommercebackend.repository.*;
import org.springframework.http.HttpStatus;
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
    private final UserAddressRepository userAddressRepository;
    private final UserLoginLogRepository userLoginLogRepository;
    private final UserBlacklistRepository userBlacklistRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepository,
                            RoleRepository roleRepository,
                            UserAddressRepository userAddressRepository,
                            UserLoginLogRepository userLoginLogRepository,
                            UserBlacklistRepository userBlacklistRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userAddressRepository = userAddressRepository;
        this.userLoginLogRepository = userLoginLogRepository;
        this.userBlacklistRepository = userBlacklistRepository;
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

        return toResponse(userRepository.save(user));
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

        return toResponse(userRepository.save(user));
    }

    // ===== Delete =====

    @Transactional
    public void deleteUser(Long id) {
        User user = getByIdOr404(id);
        userRepository.delete(user);
    }

    // ===== Blacklist =====

    @Transactional
    public UserResponse blacklistUser(Long id, BlacklistRequest req) {
        User user = getByIdOr404(id);

        UserBlacklist entry = new UserBlacklist();
        entry.setUser(user);
        entry.setReason(req.getReason());
        userBlacklistRepository.save(entry);

        user.setStatus(User.UserStatus.BANNED);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse removeFromBlacklist(Long id) {
        User user = getByIdOr404(id);
        userBlacklistRepository.deleteByUserId(id);
        user.setStatus(User.UserStatus.ACTIVE);
        return toResponse(userRepository.save(user));
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
                        l.getId(), l.getLoginIp(), l.getDeviceInfo(),
                        l.getLoginTime(), l.getSuccessFlag()))
                .toList();
    }

    public List<UserBlacklist> getUserBlacklistEntries(Long id) {
        getByIdOr404(id);
        return userBlacklistRepository.findByUserIdOrderByCreatedAtDesc(id);
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

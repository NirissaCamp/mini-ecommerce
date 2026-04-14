package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.UserProfileRequest;
import com.guang.miniecommercebackend.entity.User;
import com.guang.miniecommercebackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.guang.miniecommercebackend.dto.ChangePasswordRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileController(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User currentUser(){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return  userRepository.findByUsername(username)
                .orElseThrow(()-> new ResponseStatusException((HttpStatus.UNAUTHORIZED), "user not found"));
    }

    /*GET  /api/user/profile/*/
    @GetMapping
    public  Map<String, String> getProfile(){
        User user = currentUser();
        return  Map.of(
                "username", user.getUsername(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "phone", user.getPhone() != null ? user.getPhone() : ""
        );
    }

    /* PUT /api/user/profile   */
    @PutMapping
    public Map<String, String> updateProfile(UserProfileRequest req) {
        User user = currentUser();

        if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
            }
            user.setEmail(req.getEmail().isBlank() ? null : req.getEmail());
        }

        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().isBlank() ? null : req.getPhone());
        }
        userRepository.save(user);
        return  Map.of(
                "username", user.getUsername(),
                "email", user.getEmail() != null? user.getEmail(): "",
                "phone", user.getPhone() != null? user.getPhone(): ""
        );
    }

    /** PUT /api/user/profile/password */
    @PutMapping("/password")
    public Map<String, String> changePassword(@RequestBody ChangePasswordRequest req) {
        User user = currentUser();

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        return Map.of("message", "Password changed successfully");
    }
}

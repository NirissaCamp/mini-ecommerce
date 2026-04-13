package com.guang.miniecommercebackend.dto;

import com.guang.miniecommercebackend.entity.User;

import java.time.LocalDateTime;
import java.util.Set;

public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String phone;
    private User.UserStatus status;
    private Integer levelId;
    private Set<String> roles;
    private boolean blacklisted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserResponse(Long id, String username, String email, String phone,
                        User.UserStatus status, Integer levelId, Set<String> roles,
                        boolean blacklisted, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.levelId = levelId;
        this.roles = roles;
        this.blacklisted = blacklisted;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public User.UserStatus getStatus() { return status; }
    public void setStatus(User.UserStatus status) { this.status = status; }

    public Integer getLevelId() { return levelId; }
    public void setLevelId(Integer levelId) { this.levelId = levelId; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public boolean isBlacklisted() { return blacklisted; }
    public void setBlacklisted(boolean blacklisted) { this.blacklisted = blacklisted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.guang.miniecommercebackend.dto;

import com.guang.miniecommercebackend.entity.User;

import java.time.LocalDateTime;

public class UserBlacklistResponse {

    private Long id;
    private Long userId;
    private String username;
    private User.UserStatus status;
    private String reason;
    private String bannedBy;
    private LocalDateTime bannedAt;

    public UserBlacklistResponse(Long id, Long userId, String username,
                                  User.UserStatus status, String reason,
                                  String bannedBy, LocalDateTime bannedAt) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.status = status;
        this.reason = reason;
        this.bannedBy = bannedBy;
        this.bannedAt = bannedAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public User.UserStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getBannedBy() { return bannedBy; }
    public LocalDateTime getBannedAt() { return bannedAt; }
}

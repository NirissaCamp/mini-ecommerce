package com.guang.miniecommercebackend.dto;

public class UserSummaryResponse {
    private Long id;
    private String username;

    public UserSummaryResponse(Long id, String username) {
        this.id = id;
        this.username = username;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
}

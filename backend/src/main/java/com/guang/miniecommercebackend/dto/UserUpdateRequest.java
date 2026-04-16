package com.guang.miniecommercebackend.dto;

import com.guang.miniecommercebackend.entity.User;

import java.util.Set;

public class UserUpdateRequest {

    private String email;
    private String phone;
    private String password;
    private User.UserStatus status;
    private Integer levelId;
    private Set<String> roleNames;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public User.UserStatus getStatus() { return status; }
    public void setStatus(User.UserStatus status) { this.status = status; }

    public Integer getLevelId() { return levelId; }
    public void setLevelId(Integer levelId) { this.levelId = levelId; }

    public Set<String> getRoleNames() { return roleNames; }
    public void setRoleNames(Set<String> roleNames) { this.roleNames = roleNames; }
}

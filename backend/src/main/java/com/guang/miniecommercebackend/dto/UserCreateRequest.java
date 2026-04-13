package com.guang.miniecommercebackend.dto;

import java.util.Set;

public class UserCreateRequest {

    private String username;
    private String password;
    private String email;
    private String phone;
    private Integer levelId;
    private Set<String> roleNames;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Integer getLevelId() { return levelId; }
    public void setLevelId(Integer levelId) { this.levelId = levelId; }

    public Set<String> getRoleNames() { return roleNames; }
    public void setRoleNames(Set<String> roleNames) { this.roleNames = roleNames; }
}

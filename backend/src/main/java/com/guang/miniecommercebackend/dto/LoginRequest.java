package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank
    @Size(min = 3, max = 50, message = "The length of the username should be between 3 and 50 characters")
    private String username;

    @NotBlank
    @Size(min = 6, max = 72, message = "The length of the password should be between 6 and 72 characters")
    private String password;

    public String getUsername(){return username;}
    public String getPassword(){return password;}

    public void setUsername(String username){this.username = username;}
    public void setPassword(String password){this.password = password;}
}

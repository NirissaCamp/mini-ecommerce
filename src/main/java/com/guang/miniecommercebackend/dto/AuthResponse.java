package com.guang.miniecommercebackend.dto;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String role;

    public AuthResponse(String token, String username, String role){
        this.token = token;
        this.username = username;
        this.role = role;
    }

    public String getToken(){ return token; }
    public String getTokenType(){ return tokenType; }
    public String getUsername(){ return username; }
    public String getRole(){ return role; }

    public void setToken(String token){ this.token = token;}
    public void setTokenType(String tokenType){ this.tokenType = tokenType; }
    public void setUsername(String username){ this.username = username; }
    public void setRole(String role){this.role = role; }
}

package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.AuthResponse;
import com.guang.miniecommercebackend.dto.LoginRequest;
import com.guang.miniecommercebackend.dto.RegisterRequest;
import com.guang.miniecommercebackend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService){
        this.authService = authService;
    }

    /**
     * POST /api/auth/register
     * Body: JSON { "username": "...", "password": "..." .}
     * triggers validation on RegisterRequest (@NotBlank, @Size, ...).
     */

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request){
        return authService.register(request);
    }

    /**
     * POST /api/auth/login
     * Body: JSON { "username": "...", "password": "..." }
     */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest){
        return authService.login(request, httpRequest);
    }

    /**
     * GET /api/auth/me — requires Authorization: Bearer &lt;token&gt; (JWT filter sets SecurityContext).
     * GET /api/auth/me — 需在请求头带上 Bearer Token，由 JwtAuthenticationFilter 写入登录态。
     */
    @GetMapping("/me")
    public Map<String, String> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (String) auth.getPrincipal();
        String authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return Map.of(
                "username", username,
                "authorities", authorities
        );
    }

}

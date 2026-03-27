package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.AuthResponse;
import com.guang.miniecommercebackend.dto.LoginRequest;
import com.guang.miniecommercebackend.dto.RegisterRequest;
import com.guang.miniecommercebackend.entity.User;
import com.guang.miniecommercebackend.repository.UserRepository;
import com.guang.miniecommercebackend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

//@Service
//中文：交给 Spring 管理，可被 @Autowired / 构造器注入。
//English: Spring-managed bean, injectable into controllers.
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

    }
//        Register a new user with role USER, then return a JWT(same shape as login).
//        注册新用户（默认角色 USER），并返回与登录相同结构的 JWT。
    public AuthResponse register(RegisterRequest req){
        userRepository.findByUsername(req.getUsername()).ifPresent(u ->{
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username already exists");
        });

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.Role.USER);

        userRepository.save(user);

        return toAuthResponse(user);
    }

/**
 * Verify username/password, then return JWT.
 * 校验用户名与密码，成功后签发 JWT。
 */

public AuthResponse login(LoginRequest req){
    User user = userRepository.findByUsername(req.getUsername())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid username or password"));

    if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())){
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid username or password");
    }
    return toAuthResponse(user);
}

private AuthResponse toAuthResponse(User user){
    String token = jwtService.generateToken(user.getUsername(), user.getRole().name());
    return new AuthResponse(token, user.getUsername(), user.getRole().name());
}
}

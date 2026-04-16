package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.AuthResponse;
import com.guang.miniecommercebackend.dto.LoginRequest;
import com.guang.miniecommercebackend.dto.RegisterRequest;
import com.guang.miniecommercebackend.entity.Role;
import com.guang.miniecommercebackend.entity.User;
import com.guang.miniecommercebackend.entity.UserLoginLog;
import com.guang.miniecommercebackend.repository.UserLoginLogRepository;
import com.guang.miniecommercebackend.repository.RoleRepository;
import com.guang.miniecommercebackend.repository.UserRepository;
import com.guang.miniecommercebackend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

//@Service
//中文：交给 Spring 管理，可被 @Autowired / 构造器注入。
//English: Spring-managed bean, injectable into controllers.
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserLoginLogRepository userLoginLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       UserLoginLogRepository userLoginLogRepository){
        this.userRepository = userRepository;
        this.userLoginLogRepository = userLoginLogRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }
//        Register a new user with role USER, then return a JWT(same shape as login).
//        注册新用户（默认角色 USER），并返回与登录相同结构的 JWT。
    public AuthResponse register(RegisterRequest req){
        userRepository.findByUsername(req.getUsername()).ifPresent(u ->{
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username already exists");
        });

        Role defaultRole = roleRepository.findByRoleName("ROLE_USER")
                .orElseThrow(()->new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Default role not configured"));

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRoles(Set.of(defaultRole));

        userRepository.save(user);

        return toAuthResponse(user);
    }

/**
 * Verify username/password, then return JWT.
 * 校验用户名与密码，成功后签发 JWT。
 */

public AuthResponse login(LoginRequest req, HttpServletRequest httpRequest){
    User user = userRepository.findByUsername(req.getUsername())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid username or password"));

    if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())){
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid username or password");
    }

    if (user.getStatus() == User.UserStatus.BANNED) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "your account has been banned");
    }

    UserLoginLog log = new UserLoginLog();
    log.setUser(user);
    log.setLoginTime(LocalDateTime.now());
    log.setSuccessFlag(true);
    log.setLoginIp(httpRequest.getRemoteAddr());
    log.setDeviceInfo(httpRequest.getHeader("User-Agent"));
    userLoginLogRepository.save(log);

    return toAuthResponse(user);
}

private AuthResponse toAuthResponse(User user){
    List<String> roleNames = user.getRoles().stream()
            .map(Role::getRoleName)
            .collect(Collectors.toList());
    String token = jwtService.generateToken(user.getUsername(), roleNames);
    String primaryRole = roleNames.isEmpty() ? "ROLE_USER" : roleNames.get(0);
    return new AuthResponse(token, user.getUsername(), primaryRole);
}
}

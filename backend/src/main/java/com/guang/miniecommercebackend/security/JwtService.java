package com.guang.miniecommercebackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expireMillis;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expire-minutes}") long expireMinutes
    ){
        this.key = Keys.hmacShaKeyFor((secret.getBytes(StandardCharsets.UTF_8)));
        this.expireMillis = expireMinutes * 60_000L;
    }

//    generateToken：登录成功后生成 token（写入 subject=username、roles 这类 claim）。
    public String generateToken(String username, List<String> roles){
        Instant now = Instant.now();
        Instant exp = now.plusMillis(expireMillis);

        return Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

//    parseClaims：解析 token，并且验证签名（签名不对会抛异常）。
    public Claims parseClaims(String token){
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

//    isValid：给过滤器/鉴权用的“轻量校验”。
    public boolean isValid(String token){
        try{
            Claims claims = parseClaims((token));
            Date exp = claims.getExpiration();
            return exp != null && exp.after(new Date());
        } catch (Exception e){
            return false;
        }
    }

}

package com.guang.miniecommercebackend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    // 排除 /api、/ws（WebSocket/SockJS）、/assets，避免 SPA 转发抢走 WebSocket 握手请求
    @GetMapping(value = {
            "/{spring:^(?!api|ws|assets)[^\\.]*$}",
            "/{spring:^(?!api|ws|assets)[^\\.]*$}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
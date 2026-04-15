package com.guang.miniecommercebackend.dto;

import java.time.LocalDateTime;

public class UserLoginLogResponse {

    private Long id;
    private String username;
    private String loginIp;
    private String deviceInfo;
    private LocalDateTime loginTime;
    private Boolean successFlag;

    public UserLoginLogResponse(Long id, String username, String loginIp, String deviceInfo,
                                LocalDateTime loginTime, Boolean successFlag) {
        this.id = id;
        this.username = username;
        this.loginIp = loginIp;
        this.deviceInfo = deviceInfo;
        this.loginTime = loginTime;
        this.successFlag = successFlag;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getLoginIp() { return loginIp; }
    public void setLoginIp(String loginIp) { this.loginIp = loginIp; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }

    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }

    public Boolean getSuccessFlag() { return successFlag; }
    public void setSuccessFlag(Boolean successFlag) { this.successFlag = successFlag; }
}

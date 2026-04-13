package com.guang.miniecommercebackend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_login_log")
public class UserLoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "login_ip", length = 50)
    private String loginIp;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "success_flag", nullable = false)
    private Boolean successFlag;

    @PrePersist
    public void prePersist() {
        if (loginTime == null) loginTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getLoginIp() { return loginIp; }
    public void setLoginIp(String loginIp) { this.loginIp = loginIp; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }

    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }

    public Boolean getSuccessFlag() { return successFlag; }
    public void setSuccessFlag(Boolean successFlag) { this.successFlag = successFlag; }
}

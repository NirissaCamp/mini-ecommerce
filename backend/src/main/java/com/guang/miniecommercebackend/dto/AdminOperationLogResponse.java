package com.guang.miniecommercebackend.dto;

import com.guang.miniecommercebackend.entity.AdminOperationLog;

import java.time.LocalDateTime;

public class AdminOperationLogResponse {

    private Long id;
    private Long targetUserId;
    private String targetUsername;
    private String operatorUsername;
    private AdminOperationLog.ActionType action;
    private String detail;
    private LocalDateTime createdAt;

    public AdminOperationLogResponse(Long id, Long targetUserId, String targetUsername,
                                     String operatorUsername, AdminOperationLog.ActionType action,
                                     String detail, LocalDateTime createdAt) {
        this.id = id;
        this.targetUserId = targetUserId;
        this.targetUsername = targetUsername;
        this.operatorUsername = operatorUsername;
        this.action = action;
        this.detail = detail;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getTargetUserId() { return targetUserId; }
    public String getTargetUsername() { return targetUsername; }
    public String getOperatorUsername() { return operatorUsername; }
    public AdminOperationLog.ActionType getAction() { return action; }
    public String getDetail() { return detail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

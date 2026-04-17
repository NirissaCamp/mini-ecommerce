package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.NotBlank;

public class RejectReturnRequest {
    @NotBlank
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}

package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdjustStockRequest {

    @NotNull
    private Integer delta;

    @NotBlank
    private String reason;

    public Integer getDelta() { return delta; }
    public void setDelta(Integer delta) { this.delta = delta; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}

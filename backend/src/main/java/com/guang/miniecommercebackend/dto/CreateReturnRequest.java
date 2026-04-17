package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CreateReturnRequest {
    @NotBlank
    private String reason;

    @NotNull @NotEmpty
    private List<ReturnItemRequest> items;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public List<ReturnItemRequest> getItems() { return items; }
    public void setItems(List<ReturnItemRequest> items) { this.items = items; }
}

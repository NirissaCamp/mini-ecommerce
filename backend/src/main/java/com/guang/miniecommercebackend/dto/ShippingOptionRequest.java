package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.NotBlank;

public class ShippingOptionRequest {
    @NotBlank
    private String label;

    private String description;

    private Boolean isFree = false;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsFree() { return isFree; }
    public void setIsFree(Boolean isFree) { this.isFree = isFree; }
}

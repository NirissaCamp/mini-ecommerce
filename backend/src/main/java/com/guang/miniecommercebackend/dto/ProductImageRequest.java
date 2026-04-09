package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.NotBlank;

public class ProductImageRequest {
    @NotBlank
    private String imageUrl;

    private Boolean isPrimary = false;

    private Integer sortOrder = 0;

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}

package com.guang.miniecommercebackend.dto;

public class ProductImageResponse {
    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private Integer sortOrder;

    public ProductImageResponse() {}

    public ProductImageResponse(Long id, String imageUrl, Boolean isPrimary, Integer sortOrder) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.isPrimary = isPrimary;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}

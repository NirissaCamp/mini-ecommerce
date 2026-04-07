package com.guang.miniecommercebackend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 返回给前端的商品信息，避免直接暴露实体、也方便以后字段与表结构解耦。
 */
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private Boolean active;
    private LocalDateTime createdAt;
    private List<ProductImageResponse> images;
    private List<ProductBulletResponse> bullets;
    private List<ShippingOptionResponse> shippingOptions;

    public ProductResponse() {
    }

    public ProductResponse(Long id, String name, String description, BigDecimal price,
                           Integer stock, Boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ProductImageResponse> getImages() { return images; }
    public void setImages(List<ProductImageResponse> images) { this.images = images; }

    public List<ProductBulletResponse> getBullets() { return bullets; }
    public void setBullets(List<ProductBulletResponse> bullets) { this.bullets = bullets; }

    public List<ShippingOptionResponse> getShippingOptions() { return shippingOptions; }
    public void setShippingOptions(List<ShippingOptionResponse> shippingOptions) { this.shippingOptions =
            shippingOptions; }
}

package com.guang.miniecommercebackend.dto;

public class ShippingOptionResponse {
    private Long id;
    private String label;
    private String description;
    private Boolean isFree;

    public ShippingOptionResponse() {}

    public ShippingOptionResponse(Long id, String label, String description, Boolean isFree) {
        this.id = id;
        this.label = label;
        this.description = description;
        this.isFree = isFree;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsFree() { return isFree; }
    public void setIsFree(Boolean isFree) { this.isFree = isFree; }
}


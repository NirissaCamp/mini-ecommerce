package com.guang.miniecommercebackend.dto;

public class ProductBulletRequest {
    private String brand;
    private String weight;
    private String dimension;
    private String content;

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public String getDimension() { return dimension; }
    public void setDimension(String dimension) { this.dimension = dimension; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

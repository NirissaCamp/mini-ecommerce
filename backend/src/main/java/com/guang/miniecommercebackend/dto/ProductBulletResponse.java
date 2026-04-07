package com.guang.miniecommercebackend.dto;

public class ProductBulletResponse {
    private Long id;
    private String brand;
    private String weight;
    private String dimension;
    private String content;
    private Integer sortOrder;

    public ProductBulletResponse() {}

    public ProductBulletResponse(Long id, String brand, String weight, String dimension,
                                 String content, Integer sortOrder) {
        this.id = id;
        this.brand = brand;
        this.weight = weight;
        this.dimension = dimension;
        this.content = content;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public String getDimension() { return dimension; }
    public void setDimension(String dimension) { this.dimension = dimension; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
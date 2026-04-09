package com.guang.miniecommercebackend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "t_product_bullet")
public class ProductBullet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = true, length = 100)
    private String brand;

    @Column(nullable = true, length = 100)
    private String weight;

    @Column(nullable = true, length = 100)
    private String dimension;

    @Column(nullable = true, columnDefinition = "TEXT")
    private String content;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public String getDimension() { return dimension; }
    public void setDimension(String dimension) { this.dimension = dimension; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
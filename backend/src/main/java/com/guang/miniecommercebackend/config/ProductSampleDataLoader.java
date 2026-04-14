package com.guang.miniecommercebackend.config;

import com.guang.miniecommercebackend.entity.Product;
import com.guang.miniecommercebackend.entity.ProductImage;
import com.guang.miniecommercebackend.entity.ProductBullet;
import com.guang.miniecommercebackend.entity.Role;
import com.guang.miniecommercebackend.entity.ShippingOption;
import com.guang.miniecommercebackend.repository.ProductRepository;
import com.guang.miniecommercebackend.repository.ProductImageRepository;
import com.guang.miniecommercebackend.repository.ProductBulletRepository;
import com.guang.miniecommercebackend.repository.RoleRepository;
import com.guang.miniecommercebackend.repository.ShippingOptionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Profile("local")
public class ProductSampleDataLoader implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductBulletRepository productBulletRepository;
    private final ShippingOptionRepository shippingOptionRepository;
    private final RoleRepository roleRepository;

    public ProductSampleDataLoader(ProductRepository productRepository,
                                   ProductImageRepository productImageRepository,
                                   ProductBulletRepository productBulletRepository,
                                   ShippingOptionRepository shippingOptionRepository,
                                   RoleRepository roleRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.productBulletRepository = productBulletRepository;
        this.shippingOptionRepository = shippingOptionRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        // Seed roles — required before any user can register
        seedRoleIfAbsent("ROLE_USER", "Standard customer account");
        seedRoleIfAbsent("ROLE_ADMIN", "Full admin access");

        if (productRepository.count() > 0) {
            return;
        }

        // ── Product 1 ──
        Product p1 = new Product();
        p1.setName("示例笔记本");
        p1.setDescription("入门学习用笔记本，示例数据。");
        p1.setPrice(new BigDecimal("29.99"));
        p1.setStock(100);
        p1.setActive(true);
        productRepository.save(p1);

        ProductImage img1 = new ProductImage();
        img1.setProduct(p1);
        img1.setImageUrl("https://plus.unsplash.com/premium_photo-1680539292648-e03dfae3e345?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        img1.setIsPrimary(true);
        img1.setSortOrder(0);
        productImageRepository.save(img1);

        ProductBullet b1 = new ProductBullet();
        b1.setProduct(p1);
        b1.setBrand("示例品牌");
        b1.setWeight("500 grams");
        b1.setDimension("21 x 14.8 x 1.5 cm");
        b1.setContent("200 pages of high-quality lined paper. Durable hardcover suitable for daily use.");
        productBulletRepository.save(b1);

        ShippingOption s1 = new ShippingOption();
        s1.setProduct(p1);
        s1.setLabel("FREE delivery");
        s1.setDescription("Estimated 3-5 business days");
        s1.setIsFree(true);
        shippingOptionRepository.save(s1);

        // ── Product 2 ──
        Product p2 = new Product();
        p2.setName("示例鼠标");
        p2.setDescription("无线鼠标，示例数据。");
        p2.setPrice(new BigDecimal("15.50"));
        p2.setStock(50);
        p2.setActive(true);
        productRepository.save(p2);

        ProductImage img2 = new ProductImage();
        img2.setProduct(p2);
        img2.setImageUrl("https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=1065&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        img2.setIsPrimary(true);
        img2.setSortOrder(0);
        productImageRepository.save(img2);

        ProductBullet b2 = new ProductBullet();
        b2.setProduct(p2);
        b2.setBrand("示例品牌");
        b2.setWeight("120 grams");
        b2.setDimension("11.5 x 6.2 x 3.8 cm");
        b2.setContent("Wireless 2.4GHz with USB receiver");
        productBulletRepository.save(b2);

        ShippingOption s2 = new ShippingOption();
        s2.setProduct(p2);
        s2.setLabel("FREE delivery Overnight");
        s2.setDescription("4 AM - 8 AM on qualifying orders over $25");
        s2.setIsFree(true);
        shippingOptionRepository.save(s2);

        // ── Product 3 ──
        Product p3 = new Product();
        p3.setName("Table");
        p3.setDescription("A sturdy wooden table, perfect for home or office use.");
        p3.setPrice(new BigDecimal("48.00"));
        p3.setStock(1);
        p3.setActive(true);
        productRepository.save(p3);

        ProductImage img3 = new ProductImage();
        img3.setProduct(p3);
        img3.setImageUrl("https://images.unsplash.com/photo-1623177623442-979c1e42c255?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        img3.setIsPrimary(true);
        img3.setSortOrder(0);
        productImageRepository.save(img3);

        ProductBullet b3 = new ProductBullet();
        b3.setProduct(p3);
        b3.setBrand("示例品牌");
        b3.setWeight("15 kg");
        b3.setDimension("120 x 60 x 75 cm");
        b3.setContent("Solid wood construction for durability. Easy to assemble with included instructions.");
        productBulletRepository.save(b3);

        ShippingOption s3 = new ShippingOption();
        s3.setProduct(p3);
        s3.setLabel("FREE delivery");
        s3.setDescription("Estimated 5-7 business days");
        s3.setIsFree(true);
        shippingOptionRepository.save(s3);
    }

    private void seedRoleIfAbsent(String roleName, String description) {
        if (!roleRepository.existsByRoleName(roleName)) {
            Role role = new Role();
            role.setRoleName(roleName);
            role.setDescription(description);
            roleRepository.save(role);
        }
    }
}

package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.ProductImageResponse;
import com.guang.miniecommercebackend.dto.ProductImageRequest;
import com.guang.miniecommercebackend.dto.ProductBulletResponse;
import com.guang.miniecommercebackend.dto.ProductBulletRequest;
import com.guang.miniecommercebackend.dto.ShippingOptionResponse;
import com.guang.miniecommercebackend.dto.ShippingOptionRequest;
import com.guang.miniecommercebackend.dto.ProductResponse;
import com.guang.miniecommercebackend.dto.ProductUpsertRequest;
import com.guang.miniecommercebackend.entity.Product;
import com.guang.miniecommercebackend.entity.ProductImage;
import com.guang.miniecommercebackend.entity.ProductBullet;
import com.guang.miniecommercebackend.entity.ShippingOption;
import com.guang.miniecommercebackend.repository.ProductRepository;
import com.guang.miniecommercebackend.repository.ProductImageRepository;
import com.guang.miniecommercebackend.repository.ProductBulletRepository;
import com.guang.miniecommercebackend.repository.ShippingOptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductBulletRepository productBulletRepository;
    private final ShippingOptionRepository shippingOptionRepository;

    public ProductService(ProductRepository productRepository,
                          ProductImageRepository productImageRepository,
                          ProductBulletRepository productBulletRepository,
                          ShippingOptionRepository shippingOptionRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.productBulletRepository = productBulletRepository;
        this.shippingOptionRepository = shippingOptionRepository;
    }

    // ===== Public catalog (existing) =====
    public List<ProductResponse> listActiveProducts() {
        return productRepository.findByActiveTrueOrderByIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getActiveProduct(Long id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found"));
        return toResponse(product);
    }

    // ===== Admin CRUD (new) =====
    public List<ProductResponse> listAllProductsForAdmin() {
        return productRepository.findAll().stream()
                .sorted(Comparator.comparing(Product::getId))
                .map(this::toResponse)
                .toList();
    }
    public ProductResponse getProductForAdmin(Long id) {
        Product product = getByIdOr404(id);
        return toResponse(product);
    }
    public ProductResponse createProduct(ProductUpsertRequest req) {
        Product p = new Product();
        applyUpsertFields(p, req);
        Product saved = productRepository.save(p);
        return toResponse(saved);
    }
    public ProductResponse updateProduct(Long id, ProductUpsertRequest req) {
        Product p = getByIdOr404(id);
        applyUpsertFields(p, req);
        Product saved = productRepository.save(p);
        return toResponse(saved);
    }
    public void deleteProduct(Long id) {
        Product p = getByIdOr404(id);
        productImageRepository.deleteByProductId(id);      // ← delete images first
        productBulletRepository.deleteByProductId(id);     // ← delete bullet first
        shippingOptionRepository.deleteByProductId(id);    // ← delete shipping first
        productRepository.delete(p);
    }

    public ProductImageResponse addImage(Long productId, ProductImageRequest req) {
        Product product = getByIdOr404(productId);
        ProductImage img = new ProductImage();
        img.setProduct(product);
        img.setImageUrl(req.getImageUrl());
        img.setIsPrimary(req.getIsPrimary() != null ? req.getIsPrimary() : false);
        img.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        ProductImage saved = productImageRepository.save(img);
        return new ProductImageResponse(saved.getId(), saved.getImageUrl(), saved.getIsPrimary(), saved.getSortOrder());
    }

    public  ProductImageResponse updateImage(Long productId, Long imageId, ProductImageRequest req){
        ProductImage img = productImageRepository.findById(imageId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "image not found"));
        if (!img.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image doest not belong to this product");
        }
        img.setImageUrl(req.getImageUrl());
        img.setIsPrimary(req.getIsPrimary() != null ? req.getIsPrimary(): false);
        if (req.getSortOrder() != null){
            img.setSortOrder(req.getSortOrder());
        }
        ProductImage saved = productImageRepository.save(img);
        return  new ProductImageResponse(saved.getId(), saved.getImageUrl(),saved.getIsPrimary(), saved.getSortOrder());
    }

    public void deleteImage(Long productId, Long imageId) {
        ProductImage img = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "image not found"));
        if (!img.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image does not belong to this product");
        }
        productImageRepository.delete(img);
    }

    public ProductBulletResponse saveBullet(Long productId, ProductBulletRequest req) {
        Product product = getByIdOr404(productId);
        ProductBullet bullet = productBulletRepository.findByProductId(productId)
                .orElse(new ProductBullet());
        bullet.setProduct(product);
        bullet.setBrand(req.getBrand());
        bullet.setWeight(req.getWeight());
        bullet.setDimension(req.getDimension());
        bullet.setContent(req.getContent());
        ProductBullet saved = productBulletRepository.save(bullet);
        return new ProductBulletResponse(saved.getId(), saved.getBrand(), saved.getWeight(),
                saved.getDimension(), saved.getContent());
    }

    public ShippingOptionResponse addShipping(Long productId, ShippingOptionRequest req) {
        Product product = getByIdOr404(productId);
        ShippingOption shipping = new ShippingOption();
        shipping.setProduct(product);
        shipping.setLabel(req.getLabel());
        shipping.setDescription(req.getDescription());
        shipping.setIsFree(req.getIsFree() != null ? req.getIsFree() : false);
        ShippingOption saved = shippingOptionRepository.save(shipping);
        return new ShippingOptionResponse(saved.getId(), saved.getLabel(),
                saved.getDescription(), saved.getIsFree());
    }

    public void deleteShipping(Long productId, Long shippingId) {
        ShippingOption shipping = shippingOptionRepository.findById(shippingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "shipping option not found"));
        if (!shipping.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "shipping does not belong to this product");
        }
        shippingOptionRepository.delete(shipping);
    }

    private Product getByIdOr404(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found"));
    }
    private void applyUpsertFields(Product p, ProductUpsertRequest req) {
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setStock(req.getStock());
        p.setActive(req.getActive());
    }
    private ProductResponse toResponse(Product p) {
        ProductResponse response = new ProductResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getStock(),
                p.getActive(),
                p.getCreatedAt()
        );
        // map images
        List<ProductImageResponse> images = productImageRepository
                .findByProductIdOrderBySortOrderAsc(p.getId()).stream()
                .map(img -> new ProductImageResponse(
                        img.getId(),
                        img.getImageUrl(),
                        img.getIsPrimary(),
                        img.getSortOrder()))
                .toList();
        response.setImages(images);

        // map bullet (1-to-1)
        List<ProductBulletResponse> bullets = productBulletRepository
                .findByProductId(p.getId())
                .map(b -> new ProductBulletResponse(b.getId(), b.getBrand(), b.getWeight(), b.getDimension(), b.getContent()))
                .map(List::of)
                .orElse(List.of());
        response.setBullets(bullets);

        // map shipping options
        List<ShippingOptionResponse> shippingOptions = shippingOptionRepository
                .findByProductId(p.getId()).stream()
                .map(s -> new ShippingOptionResponse(
                        s.getId(),
                        s.getLabel(),
                        s.getDescription(),
                        s.getIsFree()))
                .toList();
        response.setShippingOptions(shippingOptions);
        return response;
    }
}

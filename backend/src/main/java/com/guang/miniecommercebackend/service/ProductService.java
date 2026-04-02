package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.ProductResponse;
import com.guang.miniecommercebackend.dto.ProductUpsertRequest;
import com.guang.miniecommercebackend.entity.Product;
import com.guang.miniecommercebackend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
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
        productRepository.delete(p);
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
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getStock(),
                p.getActive(),
                p.getCreatedAt()
        );
    }
}

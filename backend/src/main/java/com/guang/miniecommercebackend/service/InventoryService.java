package com.guang.miniecommercebackend.service;

import com.guang.miniecommercebackend.dto.InventoryResponse;
import com.guang.miniecommercebackend.dto.MovementResponse;
import com.guang.miniecommercebackend.entity.*;
import com.guang.miniecommercebackend.repository.InventoryMovementRepository;
import com.guang.miniecommercebackend.repository.InventoryRepository;
import com.guang.miniecommercebackend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;

    public InventoryService(InventoryRepository inventoryRepository,
                            InventoryMovementRepository movementRepository,
                            ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.productRepository = productRepository;
    }

    // ── Called by Order Management ────────────────────────────────────────────

    @Transactional
    public void allocate(Long productId, int qty, Long orderId) {
        Inventory inv = getForUpdateOr404(productId);
        if (inv.getAvailableQty() < qty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "insufficient available stock for product: " + productId);
        }
        inv.setAllocatedQty(inv.getAllocatedQty() + qty);
        inv.setAvailableQty(inv.getAvailableQty() - qty);
        inventoryRepository.save(inv);
        syncProductStock(productId, inv.getAvailableQty());
        appendMovement(productId, MovementType.ALLOCATE, qty, null,
                inv.getOnHandQty(), inv.getAllocatedQty(), inv.getAvailableQty(),
                MovementReferenceType.ORDER, orderId, null, null);
    }

    @Transactional
    public void deallocate(Long productId, int qty, Long orderId) {
        Inventory inv = getForUpdateOr404(productId);
        inv.setAllocatedQty(inv.getAllocatedQty() - qty);
        inv.setAvailableQty(inv.getAvailableQty() + qty);
        inventoryRepository.save(inv);
        syncProductStock(productId, inv.getAvailableQty());
        appendMovement(productId, MovementType.DEALLOCATE, qty, null,
                inv.getOnHandQty(), inv.getAllocatedQty(), inv.getAvailableQty(),
                MovementReferenceType.ORDER, orderId, null, null);
    }

    @Transactional
    public void fulfill(Long productId, int qty, Long orderId) {
        Inventory inv = getForUpdateOr404(productId);
        inv.setOnHandQty(inv.getOnHandQty() - qty);
        inv.setAllocatedQty(inv.getAllocatedQty() - qty);
        inventoryRepository.save(inv);
        appendMovement(productId, MovementType.FULFILL, qty, null,
                inv.getOnHandQty(), inv.getAllocatedQty(), inv.getAvailableQty(),
                MovementReferenceType.ORDER, orderId, null, null);
    }

    @Transactional
    public void processReturn(Long productId, int qty, Long returnId) {
        Inventory inv = getForUpdateOr404(productId);
        inv.setOnHandQty(inv.getOnHandQty() + qty);
        inv.setAvailableQty(inv.getAvailableQty() + qty);
        inventoryRepository.save(inv);
        syncProductStock(productId, inv.getAvailableQty());
        appendMovement(productId, MovementType.RETURN, qty, null,
                inv.getOnHandQty(), inv.getAllocatedQty(), inv.getAvailableQty(),
                MovementReferenceType.RETURN, returnId, null, null);
    }

    // ── Admin operations ──────────────────────────────────────────────────────

    @Transactional
    public void receiveStock(Long productId, int qty, BigDecimal unitCost,
                             String note, Long adminId) {
        Inventory inv = getForUpdateOr404(productId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "product not found: " + productId));

        if (product.getPrice() != null && unitCost.compareTo(product.getPrice()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unit cost cannot exceed selling price.");
        }
        inv.setOnHandQty(inv.getOnHandQty() + qty);
        inv.setAvailableQty(inv.getAvailableQty() + qty);
        inventoryRepository.save(inv);
        product.setCostPrice(unitCost);
        productRepository.save(product);
        syncProductStock(productId, inv.getAvailableQty());
        appendMovement(productId, MovementType.RECEIVE, qty, unitCost,
                inv.getOnHandQty(), inv.getAllocatedQty(), inv.getAvailableQty(),
                MovementReferenceType.MANUAL, null, note, adminId);
    }

    @Transactional
    public void manualAdjust(Long productId, int delta, String reason, Long adminId) {
        Inventory inv = getForUpdateOr404(productId);
        int newOnHand = inv.getOnHandQty() + delta;
        int newAvailable = inv.getAvailableQty() + delta;
        if (newOnHand < 0 || newAvailable < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "adjustment would result in negative stock");
        }
        inv.setOnHandQty(newOnHand);
        inv.setAvailableQty(newAvailable);
        inventoryRepository.save(inv);
        syncProductStock(productId, inv.getAvailableQty());
        appendMovement(productId, MovementType.ADJUST, delta, null,
                inv.getOnHandQty(), inv.getAllocatedQty(), inv.getAvailableQty(),
                MovementReferenceType.MANUAL, null, reason, adminId);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InventoryResponse getInventory(Long productId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "inventory not found for product: " + productId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "product not found: " + productId));
        return toResponse(inv, product);
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> listAll(String keyword, Integer lowStockThreshold) {
        List<Inventory> inventories = inventoryRepository.findAll();
        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        return inventories.stream()
                .filter(inv -> {
                    Product p = productMap.get(inv.getProductId());
                    if (p == null) return false;
                    if (keyword != null && !keyword.isBlank()
                            && !p.getName().toLowerCase().contains(keyword.toLowerCase()))
                        return false;
                    if (lowStockThreshold != null && inv.getAvailableQty() > lowStockThreshold)
                        return false;
                    return true;
                })
                .map(inv -> toResponse(inv, productMap.get(inv.getProductId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MovementResponse> getMovements(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return movementRepository
                .findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toMovementResponse);
    }

    @Transactional(readOnly = true)
    public BigDecimal getWeightedAverageCost(Long productId) {
        BigDecimal totalCost = movementRepository.sumWeightedCost(productId, MovementType.RECEIVE);
        Integer totalQty = movementRepository.sumQtyByType(productId, MovementType.RECEIVE);
        if (totalQty == null || totalQty == 0) return BigDecimal.ZERO;
        return totalCost.divide(BigDecimal.valueOf(totalQty), 2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalInventoryValue() {
        return inventoryRepository.findAll().stream()
                .map(inv -> productRepository.findById(inv.getProductId())
                        .filter(p -> p.getCostPrice() != null)
                        .map(p -> p.getCostPrice().multiply(BigDecimal.valueOf(inv.getOnHandQty())))
                        .orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Inventory getForUpdateOr404(Long productId) {
        return inventoryRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "inventory not found for product: " + productId));
    }

    private void syncProductStock(Long productId, int availableQty) {
        productRepository.findById(productId).ifPresent(p -> {
            p.setStock(availableQty);
            productRepository.save(p);
        });
    }

    private void appendMovement(Long productId, MovementType type, int qtyChange,
                                BigDecimal unitCost, int onHandAfter, int allocatedAfter,
                                int availableAfter, MovementReferenceType refType,
                                Long refId, String note, Long createdBy) {
        InventoryMovement m = new InventoryMovement();
        m.setProductId(productId);
        m.setMovementType(type);
        m.setQtyChange(qtyChange);
        m.setUnitCost(unitCost);
        m.setOnHandAfter(onHandAfter);
        m.setAllocatedAfter(allocatedAfter);
        m.setAvailableAfter(availableAfter);
        m.setReferenceType(refType);
        m.setReferenceId(refId);
        m.setNote(note);
        m.setCreatedBy(createdBy);
        movementRepository.save(m);
    }

    private InventoryResponse toResponse(Inventory inv, Product product) {
        InventoryResponse r = new InventoryResponse();
        r.setProductId(inv.getProductId());
        r.setProductName(product.getName());
        r.setOnHandQty(inv.getOnHandQty());
        r.setAllocatedQty(inv.getAllocatedQty());
        r.setAvailableQty(inv.getAvailableQty());
        r.setCostPrice(product.getCostPrice());
        r.setSellingPrice(product.getPrice());
        if (product.getCostPrice() != null && product.getPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margin = product.getPrice()
                    .subtract(product.getCostPrice())
                    .divide(product.getPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
            r.setMarginPct(margin);
        }
        return r;
    }

    private MovementResponse toMovementResponse(InventoryMovement m) {
        MovementResponse r = new MovementResponse();
        r.setId(m.getId());
        r.setProductId(m.getProductId());
        r.setMovementType(m.getMovementType().name());
        r.setQtyChange(m.getQtyChange());
        r.setUnitCost(m.getUnitCost());
        r.setOnHandAfter(m.getOnHandAfter());
        r.setAllocatedAfter(m.getAllocatedAfter());
        r.setAvailableAfter(m.getAvailableAfter());
        r.setReferenceType(m.getReferenceType() != null ? m.getReferenceType().name() : null);
        r.setReferenceId(m.getReferenceId());
        r.setNote(m.getNote());
        r.setCreatedAt(m.getCreatedAt());
        r.setCreatedBy(m.getCreatedBy());
        return r;
    }
}

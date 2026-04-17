package com.guang.miniecommercebackend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MovementResponse {
    private Long id;
    private Long productId;
    private String movementType;
    private int qtyChange;
    private BigDecimal unitCost;
    private int onHandAfter;
    private int allocatedAfter;
    private int availableAfter;
    private String referenceType;
    private Long referenceId;
    private String note;
    private LocalDateTime createdAt;
    private Long createdBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public int getQtyChange() { return qtyChange; }
    public void setQtyChange(int qtyChange) { this.qtyChange = qtyChange; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public int getOnHandAfter() { return onHandAfter; }
    public void setOnHandAfter(int onHandAfter) { this.onHandAfter = onHandAfter; }
    public int getAllocatedAfter() { return allocatedAfter; }
    public void setAllocatedAfter(int allocatedAfter) { this.allocatedAfter = allocatedAfter; }
    public int getAvailableAfter() { return availableAfter; }
    public void setAvailableAfter(int availableAfter) { this.availableAfter = availableAfter; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
}

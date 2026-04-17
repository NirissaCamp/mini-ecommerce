package com.guang.miniecommercebackend.dto;

import java.math.BigDecimal;

public class InventoryResponse {
    private Long productId;
    private String productName;
    private int onHandQty;
    private int allocatedQty;
    private int availableQty;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private BigDecimal marginPct;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getOnHandQty() { return onHandQty; }
    public void setOnHandQty(int onHandQty) { this.onHandQty = onHandQty; }
    public int getAllocatedQty() { return allocatedQty; }
    public void setAllocatedQty(int allocatedQty) { this.allocatedQty = allocatedQty; }
    public int getAvailableQty() { return availableQty; }
    public void setAvailableQty(int availableQty) { this.availableQty = availableQty; }
    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }
    public BigDecimal getMarginPct() { return marginPct; }
    public void setMarginPct(BigDecimal marginPct) { this.marginPct = marginPct; }
}

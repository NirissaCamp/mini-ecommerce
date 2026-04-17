package com.guang.miniecommercebackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ReceiveStockRequest {

    @NotNull
    @Min(1)
    private Integer qty;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal unitCost;

    private String note;

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

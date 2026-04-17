package com.guang.miniecommercebackend.dto;

import java.math.BigDecimal;
import java.util.Map;

public class OrderAnalyticsResponse {
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal avgOrderValue;
    private Map<String, Long> ordersByStatus;
    private Long totalReturns;
    private double returnRate; // percentage, e.g. 5.25 means 5.25%

    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public BigDecimal getAvgOrderValue() { return avgOrderValue; }
    public void setAvgOrderValue(BigDecimal avgOrderValue) { this.avgOrderValue = avgOrderValue; }
    public Map<String, Long> getOrdersByStatus() { return ordersByStatus; }
    public void setOrdersByStatus(Map<String, Long> ordersByStatus) { this.ordersByStatus = ordersByStatus; }
    public Long getTotalReturns() { return totalReturns; }
    public void setTotalReturns(Long totalReturns) { this.totalReturns = totalReturns; }
    public double getReturnRate() { return returnRate; }
    public void setReturnRate(double returnRate) { this.returnRate = returnRate; }
}

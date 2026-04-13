package com.guang.miniecommercebackend.dto;

import java.time.LocalDateTime;

public class UserAddressResponse {

    private Long id;
    private String receiverName;
    private String receiverPhone;
    private String state;
    private String city;
    private String district;
    private String detailAddress;
    private Boolean isDefault;
    private LocalDateTime createdAt;

    public UserAddressResponse(Long id, String receiverName, String receiverPhone,
                               String state, String city, String district,
                               String detailAddress, Boolean isDefault, LocalDateTime createdAt) {
        this.id = id;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.state = state;
        this.city = city;
        this.district = district;
        this.detailAddress = detailAddress;
        this.isDefault = isDefault;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getReceiverPhone() { return receiverPhone; }
    public void setReceiverPhone(String receiverPhone) { this.receiverPhone = receiverPhone; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getDetailAddress() { return detailAddress; }
    public void setDetailAddress(String detailAddress) { this.detailAddress = detailAddress; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

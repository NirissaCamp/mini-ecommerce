package com.guang.miniecommercebackend.dto;

public class PermissionResponse {
    private Long id;
    private String permissionCode;
    private String permissionName;

    public PermissionResponse(Long id, String permissionCode, String permissionName) {
        this.id = id;
        this.permissionCode = permissionCode;
        this.permissionName = permissionName;
    }

    public Long getId() { return id; }
    public String getPermissionCode() { return permissionCode; }
    public String getPermissionName() { return permissionName; }
}

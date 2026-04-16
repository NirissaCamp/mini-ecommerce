package com.guang.miniecommercebackend.dto;

import java.util.List;

public class RoleResponse {
    private Long id;
    private String roleName;
    private String description;
    private boolean isAdminRole;
    private int userCount;
    private List<UserSummaryResponse> users;
    private List<PermissionResponse> permissions;

    public RoleResponse(Long id, String roleName, String description, boolean isAdminRole,
                        int userCount, List<UserSummaryResponse> users, List<PermissionResponse> permissions) {
        this.id = id;
        this.roleName = roleName;
        this.description = description;
        this.isAdminRole = isAdminRole;
        this.userCount = userCount;
        this.users = users;
        this.permissions = permissions;
    }

    public Long getId() { return id; }
    public String getRoleName() { return roleName; }
    public String getDescription() { return description; }
    public boolean isAdminRole() { return isAdminRole; }
    public int getUserCount() { return userCount; }
    public List<UserSummaryResponse> getUsers() { return users; }
    public List<PermissionResponse> getPermissions() { return permissions; }
}

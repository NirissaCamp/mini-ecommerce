package com.guang.miniecommercebackend.entity;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "t_permission")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "permission_code", unique = true, nullable = false, length = 100)
    private String permissionCode;

    @Column(name = "permission_name", length = 100)
    private String permissionName;

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles = new HashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPermissionCode() { return permissionCode; }
    public void setPermissionCode(String permissionCode) { this.permissionCode = permissionCode; }

    public String getPermissionName() { return permissionName; }
    public void setPermissionName(String permissionName) { this.permissionName = permissionName; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
}

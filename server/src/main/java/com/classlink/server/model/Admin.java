package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
@Entity
@Data
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long adminId;

    private String name;
    private String email;
    private String password;
    private String role;
    private String profileImageUrl; // URL for avatar served via /static/profile/**
    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean isActive = true;
    @Column(name = "removed_by")
    private String removedBy;

}

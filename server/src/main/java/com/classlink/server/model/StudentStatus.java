package com.classlink.server.model;

public enum StudentStatus {
    REGISTERED,
    PENDING, // Registered, waiting for admin
    APPROVED, // Can log in and enroll
    REJECTED, // Admin denied access
    INACTIVE // Graduated or removed
}
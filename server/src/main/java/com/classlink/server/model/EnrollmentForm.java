package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class EnrollmentForm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Fields used for filtering
    private String department;
    private String program;
    private Integer yearLevel;
    private String semester;

    // ... other student/form data fields
}
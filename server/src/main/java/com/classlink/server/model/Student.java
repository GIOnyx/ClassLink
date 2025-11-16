package com.classlink.server.model;

import java.time.LocalDate; // ✅ ADD THIS IMPORT
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Entity
@Data
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String email;

    private String program;
    private Integer yearLevel;
    private String department;
    private String password;

    @Enumerated(EnumType.STRING)
    private StudentStatus status;

    @OneToMany(mappedBy = "student")
    private List<Enrollment> enrollments;

    // --- ✅ ADD ALL THESE NEW FIELDS ---
    private LocalDate birthDate;
    private String gender;
    private String studentAddress;
    private String contactNumber;
    private String parentGuardianName;
    private String relationshipToStudent;
    private String parentContactNumber;
    private String parentEmailAddress;
    private String gradeProgramApplyingFor;
    private String previousSchool;
}
package com.classlink.server.model;

import java.time.LocalDate; // ✅ ADD THIS IMPORT
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    private Integer yearLevel;
    private String semester;
    private String password;

    @Enumerated(EnumType.STRING)
    private StudentStatus status;

    @Enumerated(EnumType.STRING)
    private ApplicantType applicantType;

    @OneToMany(mappedBy = "student")
    @JsonIgnore
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
    // removed gradeProgramApplyingFor string in favor of Program relation
    private String previousSchool;

    private String rejectionReason;
    
    // Profile image URL (stored as a relative or absolute path rather than a BLOB for simplicity/performance)
    private String profileImageUrl;

    // PDF of submitted requirements for admin review
    private String requirementsDocumentUrl;
}
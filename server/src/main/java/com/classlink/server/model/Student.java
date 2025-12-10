package com.classlink.server.model;

import java.time.LocalDate; 

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

    @Column(unique = true)
    private String accountId;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    private Integer yearLevel;
    private String semester;
    private String password;
    
    @Column(name = "password_reset_required", nullable = false)
    private boolean passwordResetRequired;

    @Column(name = "email_login_grace_active")
    private boolean emailLoginGraceActive;

    @Enumerated(EnumType.STRING)
    private StudentStatus status;

    @Enumerated(EnumType.STRING)
    private ApplicantType applicantType;

    
    private LocalDate birthDate;
    private String gender;
    private String studentAddress;
    private String contactNumber;
    private String parentGuardianName;
    private String relationshipToStudent;
    private String parentContactNumber;
    private String parentEmailAddress;
   
    private String previousSchool;

    private String rejectionReason;
    
   
    private String profileImageUrl;

    
    private String requirementsDocumentUrl;

}
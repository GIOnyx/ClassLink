package com.classlink.server.model;

import jakarta.persistence.*; // Make sure all jakarta.persistence imports are present
import lombok.Data;
import java.util.List; // Import List

@Entity
@Data
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Your diagram uses studentID (int), I'm keeping Long for consistency, but you can change it.

    private String firstName;
    private String lastName;
    private String email;
    // Additional fields from the UML diagram
    private String program;
    private Integer yearLevel;
    private String department;
    private String password;

    // Add this to create the other side of the relationship
    @OneToMany(mappedBy = "student")
    private List<Enrollment> enrollments;
}
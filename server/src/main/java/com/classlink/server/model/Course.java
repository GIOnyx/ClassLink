package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer courseID;

    private String courseCode;
    private String title;
    private String description;
    private int units;
    private int capacity;

    // Establishes the One-to-Many relationship with Enrollment
    @OneToMany(mappedBy = "course")
    private List<Enrollment> enrolledStudents;
}
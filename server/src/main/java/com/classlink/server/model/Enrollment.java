package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Data
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer enrollmentID;

    // Establishes the Many-to-One relationship with Student
    @ManyToOne
    @JoinColumn(name = "student_id") // This creates the foreign key column
    private Student student;

    private Date dateEnrolled;
    private String status;
}
package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer enrollmentID;

    @ManyToOne
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties("enrollments")
    private Student student;

    // ✅ ADD THIS BACK
    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    private Date dateEnrolled;
    private String status;
}
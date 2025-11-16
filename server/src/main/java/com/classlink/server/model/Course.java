package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    // Program/College this course belongs to
    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    // The teacher assigned to this course
    @ManyToOne
    @JoinColumn(name = "assigned_teacher_id")
    private Teacher assignedTeacher;

    // Optional schedule for this course
    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    // Establishes the One-to-Many relationship with Enrollment
    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<Enrollment> enrolledStudents;
}
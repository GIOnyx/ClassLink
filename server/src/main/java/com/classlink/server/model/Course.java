package com.classlink.server.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Data;

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

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    // Relationship to Enrollment
    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<Enrollment> enrolledStudents;
}
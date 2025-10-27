package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;
import java.util.List;

@Entity
@Data
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dayOfWeek; // e.g., MONDAY
    private LocalTime startTime;
    private LocalTime endTime;

    @OneToMany
    private List<Course> courses;
}

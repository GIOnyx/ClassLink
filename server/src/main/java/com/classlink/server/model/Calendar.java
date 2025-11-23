package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Calendar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    // These two are the only date-related fields needed for your current feature:
    private LocalDate startDate;
    private LocalDate endDate;

    // TYPES: "EXAM", "HOLIDAY", "EVENT", "SEMESTER_END"
    private String type;

    private String description;
}
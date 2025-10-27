package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Grade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String letter;
    @Column(name = "numeric_value")
    private Double numericValue;

    @ManyToOne
    private Student student;

    @ManyToOne
    private Course course;
}

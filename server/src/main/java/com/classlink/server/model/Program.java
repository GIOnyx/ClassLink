package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Program {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Integer durationInYears;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
}

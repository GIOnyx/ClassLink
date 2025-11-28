package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "curriculum_version")
@Data
public class CurriculumVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @Column(name = "version_name")
    private String versionName;

    @Column(name = "effectivity_year")
    private Integer effectivityYear;

    @Column(name = "duration_in_years")
    private Integer durationInYears;
}

package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "course")
@Data
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subject_code")
    private String subjectCode;

    @Column(length = 1000)
    private String description;

    @Column(name = "equiv_subject_code")
    private String equivSubjectCode;

    private String prerequisite;
    private String semester;
    private String termTitle;
    private Integer units;
    private Integer year;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    @JoinColumn(name = "curriculum_version_id")
    private Curriculum curriculum;

}

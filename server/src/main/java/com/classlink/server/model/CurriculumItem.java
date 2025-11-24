package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class CurriculumItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "curriculum_id")
    @JsonIgnore
    private Curriculum curriculum;

    // Year label, e.g. "First Year" or numeric year value
    private String yearLabel;

    // Term title, e.g. "First Term", "Second Term"
    private String termTitle;

    private String subjectCode;
    private String prerequisite;
    private String equivSubjectCode;
    @Column(length = 1000)
    private String description;
    private Integer units;
    private String semester;
}

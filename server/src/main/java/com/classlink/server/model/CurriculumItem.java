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
    @JoinColumn(name = "program_id")
    @JsonIgnore
    private Program program;

    // Year label, e.g. "First Year" or numeric year value
    @Column(name = "year")
    private String yearLabel;

    // Term title (deprecated) — kept for compatibility but not used. Prefer `semester`.
    // NOTE: UI and controllers should prefer `semester` and `yearLabel`.
    private String termTitle;

    private String subjectCode;
    private String prerequisite;
    private String equivSubjectCode;
    @Column(length = 1000)
    private String description;
    private Integer units;
    private String semester;
}

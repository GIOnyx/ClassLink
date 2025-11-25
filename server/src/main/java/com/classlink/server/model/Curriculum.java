package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
public class Curriculum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long curriculumId;

    /** Program code or short id (e.g. BSIT) */
    private String programCode;

    // Optional human readable program name
    private String programName;

    @ManyToOne
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({"programs"})
    private Department department;

    // Legacy curriculum items were previously stored on Curriculum. Items are now stored
    // on Program via CurriculumItem.program. The `items` collection is kept as a
    // transient property so the controller can accept incoming payloads, but it is
    // not mapped by JPA to avoid conflicts with the new model.
    @Transient
    private List<CurriculumItem> items;

    // transient field used when creating a curriculum to also convey program duration
    @Transient
    private Integer durationInYears;

}

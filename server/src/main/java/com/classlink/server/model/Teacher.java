package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Teacher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long teacherId;

    private String name;
    private String email;

    @OneToMany(mappedBy = "assignedTeacher")
    private List<Course> courses;
}

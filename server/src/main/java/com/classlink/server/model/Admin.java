package com.classlink.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long adminId;

    private String name;
    private String email;
    private String password;
    private String role;
    private String profileImageUrl; // URL for avatar served via /static/profile/**

    @OneToMany
    @JsonIgnore
    private List<Student> managesStudents;
}

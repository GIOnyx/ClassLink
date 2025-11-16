package com.classlink.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.Teacher; // ✅ Import Optional

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    // ✅ ADD THIS METHOD: Used to check for duplicate emails
    Optional<Teacher> findByEmail(String email);
}
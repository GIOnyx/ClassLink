package com.classlink.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.Enrollment;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Integer> {
}
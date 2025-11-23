package com.classlink.server.repository;

import com.classlink.server.model.EnrollmentForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // ADDED: Required for custom query
import org.springframework.data.repository.query.Param; // ADDED: Required for @Param
import java.util.List;

public interface EnrollmentFormRepository extends JpaRepository<EnrollmentForm, Long> {

    // Custom method signature to support filtering
    @Query("SELECT ef FROM EnrollmentForm ef WHERE " +
    // Filter 1: Department (College)
            "(:department IS NULL OR ef.department = :department) AND " +
            // Filter 2: Program (BS of what)
            "(:program IS NULL OR ef.program = :program) AND " +
            // Filter 3: Year Level
            "(:yearLevel IS NULL OR ef.yearLevel = :yearLevel) AND " +
            // Filter 4: Semester
            "(:semester IS NULL OR ef.semester = :semester)")
    List<EnrollmentForm> findFormsByFilters(
            @Param("department") String department,
            @Param("program") String program,
            @Param("yearLevel") Integer yearLevel,
            @Param("semester") String semester);

    // NOTE: This implementation relies on your EnrollmentForm model having the
    // fields:
    // 'department', 'program', 'yearLevel', and 'semester'.
}
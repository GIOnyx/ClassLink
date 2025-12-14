package com.classlink.server.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.ApplicationHistory;
import com.classlink.server.model.StudentStatus;

public interface ApplicationHistoryRepository extends JpaRepository<ApplicationHistory, Long> {
    List<ApplicationHistory> findAllByStudentIdOrderByChangedAtDesc(Long studentId);
    Optional<ApplicationHistory> findTopByStudentIdAndStatusOrderByChangedAtDesc(Long studentId, StudentStatus status);
}

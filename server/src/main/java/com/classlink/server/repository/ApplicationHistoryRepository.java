package com.classlink.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.ApplicationHistory;

public interface ApplicationHistoryRepository extends JpaRepository<ApplicationHistory, Long> {
    List<ApplicationHistory> findAllByStudentIdOrderByChangedAtDesc(Long studentId);
}

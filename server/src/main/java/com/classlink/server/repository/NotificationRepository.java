package com.classlink.server.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    long countByStudentIdAndReadFalse(Long studentId);
    Optional<Notification> findByIdAndStudentId(Long id, Long studentId);
}

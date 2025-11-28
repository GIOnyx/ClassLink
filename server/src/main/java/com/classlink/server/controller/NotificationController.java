package com.classlink.server.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.service.NotificationService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> listMyNotifications(HttpSession session) {
        Long studentId = resolveStudentId(session);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Notifications are available for student accounts only.");
        }
        return ResponseEntity.ok(notificationService.getNotificationsForStudent(studentId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(HttpSession session) {
        Long studentId = resolveStudentId(session);
        if (studentId == null) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
        long count = notificationService.getUnreadCount(studentId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, HttpSession session) {
        Long studentId = resolveStudentId(session);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Notifications are available for student accounts only.");
        }
        notificationService.markAsRead(id, studentId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Long resolveStudentId(HttpSession session) {
        if (session == null) {
            return null;
        }
        Object role = session.getAttribute("role");
        if (role == null || !"STUDENT".equals(role.toString())) {
            return null;
        }
        Object userId = session.getAttribute("userId");
        if (userId == null) {
            return null;
        }
        return ((Number) userId).longValue();
    }
}

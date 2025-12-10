package com.classlink.server.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.security.ClasslinkUserDetails;
import com.classlink.server.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> listMyNotifications(@AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long studentId = resolveStudentId(principal);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Notifications are available for student accounts only.");
        }
        return ResponseEntity.ok(notificationService.getNotificationsForStudent(studentId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long studentId = resolveStudentId(principal);
        if (studentId == null) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
        long count = notificationService.getUnreadCount(studentId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id,
                                        @AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long studentId = resolveStudentId(principal);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Notifications are available for student accounts only.");
        }
        notificationService.markAsRead(id, studentId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/unread")
    public ResponseEntity<?> markAsUnread(@PathVariable Long id,
                                          @AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long studentId = resolveStudentId(principal);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Notifications are available for student accounts only.");
        }
        notificationService.markAsUnread(id, studentId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id,
                                                @AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long studentId = resolveStudentId(principal);
        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Notifications are available for student accounts only.");
        }
        notificationService.deleteNotification(id, studentId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Long resolveStudentId(ClasslinkUserDetails principal) {
        if (principal == null || !principal.isStudent()) {
            return null;
        }
        return principal.getUserId();
    }
}

package com.classlink.server.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.classlink.server.dto.NotificationDto;
import com.classlink.server.model.Calendar;
import com.classlink.server.model.Notification;
import com.classlink.server.model.NotificationType;
import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.NotificationRepository;
import com.classlink.server.repository.StudentRepository;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MMM d, yyyy");

    private final NotificationRepository notificationRepository;
    private final StudentRepository studentRepository;

    public NotificationService(NotificationRepository notificationRepository, StudentRepository studentRepository) {
        this.notificationRepository = notificationRepository;
        this.studentRepository = studentRepository;
    }

    public void notifyApplicationStatusChange(Student student, StudentStatus newStatus, String remarks) {
        if (student == null || student.getId() == null || newStatus == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setStudent(student);
        notification.setType(NotificationType.APPLICATION_STATUS);
        notification.setTitle("Application " + capitalize(newStatus.name()));
        notification.setRead(false);
        StringBuilder message = new StringBuilder("Your application status is now ")
            .append(newStatus.name().replace('_', ' ').toLowerCase());
        if (remarks != null && !remarks.isBlank()) {
            message.append(". Notes: ").append(remarks.trim());
        }
        notification.setMessage(message.toString());
        notificationRepository.save(notification);
    }

    public void notifyCalendarEvent(Calendar event) {
        if (event == null || event.getTitle() == null) {
            return;
        }
        List<Student> candidates = studentRepository.findAll();
        if (candidates.isEmpty()) {
            return;
        }
        List<Notification> batch = new ArrayList<>();
        for (Student student : candidates) {
            if (student.getStatus() == StudentStatus.INACTIVE) {
                continue;
            }
            Notification notification = new Notification();
            notification.setStudent(student);
            notification.setType(NotificationType.CALENDAR_EVENT);
            notification.setTitle(event.getTitle());
            notification.setRelatedEntityId(event.getId());
            notification.setRead(false);
            notification.setMessage(buildCalendarMessage(event));
            batch.add(notification);
        }
        if (!batch.isEmpty()) {
            notificationRepository.saveAll(batch);
        }
    }

    public List<NotificationDto> getNotificationsForStudent(Long studentId) {
        return notificationRepository.findByStudentIdOrderByCreatedAtDesc(studentId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    public long getUnreadCount(Long studentId) {
        return notificationRepository.countByStudentIdAndReadFalse(studentId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long studentId) {
        Optional<Notification> notificationOpt = notificationRepository.findByIdAndStudentId(notificationId, studentId);
        if (notificationOpt.isEmpty()) {
            log.debug("Notification {} not found for student {}", notificationId, studentId);
            return;
        }
        Notification notification = notificationOpt.get();
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    private NotificationDto toDto(Notification entity) {
        return new NotificationDto(
            entity.getId(),
            entity.getType(),
            entity.getTitle(),
            entity.getMessage(),
            entity.isRead(),
            entity.getRelatedEntityId(),
            entity.getCreatedAt()
        );
    }

    private String buildCalendarMessage(Calendar event) {
        if (event.getStartDate() == null) {
            return event.getDescription() != null ? event.getDescription() : "New calendar event added.";
        }
        String start = DATE_FORMAT.format(event.getStartDate());
        String range = start;
        if (event.getEndDate() != null && !event.getEndDate().isEqual(event.getStartDate())) {
            range = start + " - " + DATE_FORMAT.format(event.getEndDate());
        }
        StringBuilder builder = new StringBuilder("Scheduled for ").append(range);
        if (event.getDescription() != null && !event.getDescription().isBlank()) {
            builder.append(" — ").append(event.getDescription().trim());
        }
        return builder.toString();
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String lower = value.toLowerCase().replace('_', ' ');
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}

package com.classlink.server.dto;

import java.time.LocalDateTime;

import com.classlink.server.model.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private Long relatedEntityId;
    private LocalDateTime createdAt;
}

package com.classlink.server.controller;

import java.util.List;
import java.util.Map;
import java.time.LocalDate; // Import LocalDate
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.classlink.server.model.Calendar;
import com.classlink.server.repository.CalendarEventRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarEventRepository calendarEventRepository;

    public CalendarController(CalendarEventRepository calendarEventRepository) {
        this.calendarEventRepository = calendarEventRepository;
    }

    // --- GET all events (Sorted by Start Date) ---
    @GetMapping
    public List<Calendar> getAllEvents() {
        // ASSUMPTION: Repository method is updated to findAllByOrderByStartDateAsc
        return calendarEventRepository.findAllByOrderByStartDateAsc();
    }

    // --- POST create a new event (Supporting date range) ---
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Calendar event, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }

        // Validation: Title, Start Date, and Type are required
        // Note: The model is assumed to have 'startDate' instead of 'date'
        if (event.getTitle() == null || event.getStartDate() == null || event.getType() == null) {
            return ResponseEntity.badRequest().body("Title, Start Date, and Type are required");
        }

        // Date Range Logic:
        // 1. If endDate is not provided (null), assume it's a single-day event
        if (event.getEndDate() == null) {
            event.setEndDate(event.getStartDate());
        }

        // 2. Validation: Ensure the end date is not before the start date
        if (event.getEndDate().isBefore(event.getStartDate())) {
            return ResponseEntity.badRequest().body("End Date cannot be before Start Date");
        }

        return ResponseEntity.ok(calendarEventRepository.save(event));
    }

    // --- DELETE an event ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        calendarEventRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // --- Admin Check Helper ---
    private boolean isAdmin(HttpSession session) {
        Object role = session.getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }
}
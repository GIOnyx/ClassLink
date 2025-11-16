package com.classlink.server.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity; // ✅ 1. Import the enum
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Admin;
import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.AdminRepository;
import com.classlink.server.repository.StudentRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminRepository adminRepository;
    private final StudentRepository studentRepository;

    public AuthController(AdminRepository adminRepository, StudentRepository studentRepository) {
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
    }

    public record LoginRequest(String email, String password, String role) {
    }

    public record RegisterRequest(String firstName, String lastName, String email, String password) {
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body, HttpSession session) {
        if (body == null || body.email() == null || body.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        Map<String, Object> payload = new HashMap<>();

        if ("admin".equalsIgnoreCase(body.role())) {
            Admin admin = adminRepository.findByEmailAndPassword(body.email(), body.password());
            if (admin == null)
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            session.setAttribute("userType", "admin");
            session.setAttribute("role", "ADMIN");
            session.setAttribute("userId", admin.getAdminId());
            payload.put("userType", "admin");
            payload.put("userId", admin.getAdminId());
            payload.put("role", "ADMIN");
            payload.put("name", admin.getName());
            return ResponseEntity.ok(payload);
        }

        // default to student
        Student student = studentRepository.findByEmailAndPassword(body.email(), body.password());
        if (student == null)
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));

        // Enforce approval: block PENDING, REJECTED or INACTIVE
        if (student.getStatus() == StudentStatus.PENDING) {
            return ResponseEntity.status(403).body(Map.of("error", "Account is pending approval"));
        }
        if (student.getStatus() == StudentStatus.REJECTED || student.getStatus() == StudentStatus.INACTIVE) {
            return ResponseEntity.status(403).body(Map.of("error", "Account is inactive or has been rejected"));
        }

        // Approved student
        session.setAttribute("userType", "student");
        session.setAttribute("role", "STUDENT");
        session.setAttribute("userId", student.getId());
        payload.put("userType", "student");
        payload.put("userId", student.getId());
        payload.put("role", "STUDENT");
        payload.put("firstName", student.getFirstName());
        payload.put("lastName", student.getLastName());
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object userType = session.getAttribute("userType");
        Object userId = session.getAttribute("userId");
        if (userType == null || userId == null)
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        Object role = session.getAttribute("role");
        return ResponseEntity.ok(Map.of("authenticated", true, "userType", userType, "userId", userId, "role", role));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest body, HttpSession session) {
        if (body == null || body.email() == null || body.password() == null || body.firstName() == null
                || body.lastName() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "firstName, lastName, email and password are required"));
        }
        if (studentRepository.findByEmail(body.email()) != null) {
            return ResponseEntity.status(409).body(Map.of("error", "Email already in use"));
        }
        Student s = new Student();
        s.setFirstName(body.firstName());
        s.setLastName(body.lastName());
        s.setEmail(body.email());
        s.setPassword(body.password());
        s.setStatus(StudentStatus.PENDING); // ✅ 3. Set status to PENDING
    studentRepository.save(s);

    // Auto-login is optional; since approval is required, we will NOT log in pending users.
    // Return created response instead.
    return ResponseEntity.status(201).body(Map.of(
        "status", "PENDING",
        "message", "Registration received and pending approval",
        "firstName", s.getFirstName(),
        "lastName", s.getLastName(),
        "email", s.getEmail()));
    }
}
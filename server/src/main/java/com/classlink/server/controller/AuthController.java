package com.classlink.server.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
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

        if (student.getStatus() == StudentStatus.INACTIVE) {
            return ResponseEntity.status(403).body(Map.of("error", "Account is inactive"));
        }

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

        // ✅ CHANGED: Set status to REGISTERED (invisible to admin) initially
        s.setStatus(StudentStatus.REGISTERED);

        Student saved = studentRepository.save(s);

        session.setAttribute("userType", "student");
        session.setAttribute("role", "STUDENT");
        session.setAttribute("userId", saved.getId());

        return ResponseEntity.status(201).body(Map.of(
                "userType", "student",
                "userId", saved.getId(),
                "role", "STUDENT",
                "firstName", saved.getFirstName(),
                "lastName", saved.getLastName()));
    }
}
package com.classlink.server.controller;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.StudentRepository;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final StudentRepository studentRepository;

	public AdminController(StudentRepository studentRepository) {
		this.studentRepository = studentRepository;
	}

	// List students, optionally filtered by status e.g.,
	// /api/admin/students?status=PENDING
	@GetMapping("/students")
	public ResponseEntity<?> listStudents(@RequestParam(name = "status", required = false) String status,
			HttpSession session) {
		// Require ADMIN role
		if (!isAdmin(session))
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
		if (status == null || status.isBlank()) {
			return ResponseEntity.ok(studentRepository.findAll());
		}
		try {
			StudentStatus s = StudentStatus.valueOf(status.toUpperCase());
			return ResponseEntity.ok(studentRepository.findAllByStatus(s));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body("Invalid status value");
		}
	}

	@PostMapping("/students")
	public ResponseEntity<?> createStudent(@RequestBody Student input, HttpSession session) {
		if (!isAdmin(session))
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
		if (input.getEmail() == null || input.getEmail().isBlank()) {
			return ResponseEntity.badRequest().body("Email is required");
		}
		if (studentRepository.findByEmail(input.getEmail()) != null) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
		}

		// Set default password if not provided
		if (input.getPassword() == null || input.getPassword().isBlank()) {
			input.setPassword("123456");
		}

		// Admin-created students are automatically APPROVED
		input.setStatus(StudentStatus.APPROVED);

		Student saved = studentRepository.save(input);
		return ResponseEntity.created(URI.create("/api/admin/students/" + saved.getId())).body(saved);
	}

	// Change status: PATCH /api/admin/students/{id}/status { "status": "APPROVED" }
	@PatchMapping("/students/{id}/status")
	public ResponseEntity<?> setStatus(@PathVariable Long id, @RequestBody Map<String, String> body,
			HttpSession session) {
		if (!isAdmin(session))
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
		Student student = studentRepository.findById(id).orElse(null);
		if (student == null)
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");

		String statusStr = body.get("status");
		if (statusStr == null || statusStr.isBlank())
			return ResponseEntity.badRequest().body("status is required");

		try {
			StudentStatus newStatus = StudentStatus.valueOf(statusStr.toUpperCase());
			student.setStatus(newStatus);

			// ✅ Save rejection reason if present
			if (body.containsKey("reason")) {
				student.setRejectionReason(body.get("reason"));
			}

			return ResponseEntity.ok(studentRepository.save(student));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body("Invalid status value");
		}
	}

	// Convenience endpoints
	@PostMapping("/students/{id}/approve")
	public ResponseEntity<?> approve(@PathVariable Long id, HttpSession session) {
		return setStatus(id, Map.of("status", "APPROVED"), session);
	}

	@PostMapping("/students/{id}/reject")
	public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
		Map<String, String> payload = new HashMap<>(body);
		payload.put("status", "REJECTED");
		return setStatus(id, payload, session);
	}

	private boolean isAdmin(HttpSession session) {
		Object role = session.getAttribute("role");
		return role != null && "ADMIN".equals(role.toString());
	}
}
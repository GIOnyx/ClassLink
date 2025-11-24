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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.model.Admin;
import com.classlink.server.repository.StudentRepository;
import com.classlink.server.repository.AdminRepository;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final StudentRepository studentRepository;
	private final AdminRepository adminRepository;

	public AdminController(StudentRepository studentRepository, AdminRepository adminRepository) {
		this.studentRepository = studentRepository;
		this.adminRepository = adminRepository;
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

	// Return currently authenticated admin basic profile (excluding password)
	@GetMapping("/me")
	public ResponseEntity<?> getMyAdmin(HttpSession session) {
		if (!isAdmin(session)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
		}
		Object userIdObj = session.getAttribute("userId");
		if (userIdObj == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
		}
		Long id = ((Number) userIdObj).longValue();
		Admin admin = adminRepository.findById(id).orElse(null);
		if (admin == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin record not found");
		}
		Map<String, Object> payload = new HashMap<>();
		payload.put("adminId", admin.getAdminId());
		payload.put("name", admin.getName());
		payload.put("email", admin.getEmail());
		payload.put("role", admin.getRole() != null ? admin.getRole() : "ADMIN");
		payload.put("profileImageUrl", admin.getProfileImageUrl());
		return ResponseEntity.ok(payload);
	}

	@PostMapping("/me/profile-image")
	public ResponseEntity<?> uploadAdminProfileImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
			HttpSession session) {
		if (!isAdmin(session)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
		}
		Object userIdObj = session.getAttribute("userId");
		if (userIdObj == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
		}
		Long id = ((Number) userIdObj).longValue();
		Admin admin = adminRepository.findById(id).orElse(null);
		if (admin == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin record not found");
		}
		if (file == null || file.isEmpty()) {
			return ResponseEntity.badRequest().body("Empty file");
		}
		if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
			return ResponseEntity.badRequest().body("File must be an image");
		}
		try {
			java.nio.file.Path uploadRoot = java.nio.file.Path.of("uploads", "profile");
			java.nio.file.Files.createDirectories(uploadRoot);
			String extension = "";
			String original = file.getOriginalFilename();
			if (original != null && original.contains(".")) {
				extension = original.substring(original.lastIndexOf('.'));
			}
			String filename = java.util.UUID.randomUUID() + extension;
			java.nio.file.Path target = uploadRoot.resolve(filename);
			java.nio.file.Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			String relative = "/static/profile/" + filename;
			String url = org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath()
				.path(relative)
				.toUriString();
			admin.setProfileImageUrl(url);
			adminRepository.save(admin);
			return ResponseEntity.ok(Map.of("profileImageUrl", url));
		} catch (java.io.IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not store image");
		}
	}

	@PutMapping("/me")
	public ResponseEntity<?> updateMyAdmin(@RequestBody Map<String, String> body, HttpSession session) {
		if (!isAdmin(session)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
		}
		Object userIdObj = session.getAttribute("userId");
		if (userIdObj == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
		}
		Long id = ((Number) userIdObj).longValue();
		Admin admin = adminRepository.findById(id).orElse(null);
		if (admin == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin record not found");
		}
		boolean changed = false;
		if (body.containsKey("name")) {
			admin.setName(body.get("name"));
			changed = true;
		}
		if (body.containsKey("email")) {
			String newEmail = body.get("email");
			if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(admin.getEmail())) {
				// ensure uniqueness
				Admin existing = adminRepository.findByEmail(newEmail);
				if (existing != null && !existing.getAdminId().equals(admin.getAdminId())) {
					return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use");
				}
				admin.setEmail(newEmail);
				changed = true;
			}
		}
		if (!changed) {
			return ResponseEntity.ok(Map.of("adminId", admin.getAdminId(), "name", admin.getName(), "email", admin.getEmail(), "profileImageUrl", admin.getProfileImageUrl()));
		}
		Admin saved = adminRepository.save(admin);
		return ResponseEntity.ok(Map.of(
			"adminId", saved.getAdminId(),
			"name", saved.getName(),
			"email", saved.getEmail(),
			"profileImageUrl", saved.getProfileImageUrl()
		));
	}
}
package com.classlink.server.controller;

import java.net.URI;
import java.util.List; // ✅ 1. Import the new Enum

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.StudentRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final StudentRepository studentRepository;

	public AdminController(StudentRepository studentRepository) {
		this.studentRepository = studentRepository;
	}

	@GetMapping("/students")
	public List<Student> listStudents() {
		return studentRepository.findAll();
	}

	@PostMapping("/students")
	public ResponseEntity<?> createStudent(@RequestBody Student input) {
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

		// ✅ 2. Admin-created students are automatically APPROVED
		// They don't need to wait in the "Pending" queue like self-registered users.
		input.setStatus(StudentStatus.APPROVED);

		Student saved = studentRepository.save(input);
		return ResponseEntity.created(URI.create("/api/admin/students/" + saved.getId())).body(saved);
	}
}
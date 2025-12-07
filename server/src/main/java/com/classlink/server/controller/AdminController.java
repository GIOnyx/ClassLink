package com.classlink.server.controller;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.dto.AdminAccountDto;
import com.classlink.server.model.Admin;
import com.classlink.server.model.ApplicationHistory;
import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.ApplicationHistoryRepository;
import com.classlink.server.repository.AdminRepository;
import com.classlink.server.repository.StudentRepository;
import com.classlink.server.service.NotificationService;
import com.classlink.server.security.ClasslinkUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private static final Logger log = LoggerFactory.getLogger(AdminController.class);

	private final StudentRepository studentRepository;
	private final AdminRepository adminRepository;
	private final ApplicationHistoryRepository applicationHistoryRepository;
	private final NotificationService notificationService;

	public AdminController(StudentRepository studentRepository, AdminRepository adminRepository,
			ApplicationHistoryRepository applicationHistoryRepository,
			NotificationService notificationService) {
		this.studentRepository = studentRepository;
		this.adminRepository = adminRepository;
		this.applicationHistoryRepository = applicationHistoryRepository;
		this.notificationService = notificationService;
	}

	public record RemoveAdminAccountRequest(String email, String password) {}

	// List students, optionally filtered by status e.g.,
	// /api/admin/students?status=PENDING
	@GetMapping("/students")
	public ResponseEntity<?> listStudents(@RequestParam(name = "status", required = false) String status) {
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

		// Admin-created students are automatically APPROVED
		input.setStatus(StudentStatus.APPROVED);
		if (input.getAccountId() == null || input.getAccountId().isBlank()) {
			input.setAccountId(generateAccountId());
		}

		Student saved = studentRepository.save(input);
		return ResponseEntity.created(URI.create("/api/admin/students/" + saved.getId())).body(saved);
	}

	// Change status: PATCH /api/admin/students/{id}/status { "status": "APPROVED" }
	@PatchMapping("/students/{id}/status")
	public ResponseEntity<?> setStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
		Student student = studentRepository.findById(id).orElse(null);
		if (student == null)
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");

		String statusStr = body.get("status");
		if (statusStr == null || statusStr.isBlank())
			return ResponseEntity.badRequest().body("status is required");

		try {
			StudentStatus newStatus = StudentStatus.valueOf(statusStr.toUpperCase());
			StudentStatus previousStatus = student.getStatus();
			student.setStatus(newStatus);

			if (newStatus == StudentStatus.APPROVED) {
				student.setFirstName(capitalizeFirstLetter(student.getFirstName()));
				student.setLastName(capitalizeFirstLetter(student.getLastName()));
			}

			if (newStatus == StudentStatus.APPROVED && (student.getAccountId() == null || student.getAccountId().isBlank())) {
				student.setAccountId(generateAccountId());
			}

			// ✅ Save rejection reason if present
			if (body.containsKey("reason")) {
				student.setRejectionReason(body.get("reason"));
			}

			Student saved = studentRepository.save(student);
			recordStatusChange(saved, previousStatus, newStatus, body.get("reason"));
			notificationService.notifyApplicationStatusChange(saved, newStatus, body.get("reason"));
			return ResponseEntity.ok(saved);
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body("Invalid status value");
		}
	}

	// Convenience endpoints
	@PostMapping("/students/{id}/approve")
	public ResponseEntity<?> approve(@PathVariable Long id) {
		return setStatus(id, Map.of("status", "APPROVED"));
	}

	@PostMapping("/students/{id}/reject")
	public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
		Map<String, String> payload = new HashMap<>(body);
		payload.put("status", "REJECTED");
		return setStatus(id, payload);
	}

	private void recordStatusChange(Student student, StudentStatus previous, StudentStatus next, String remarks) {
		if (student == null || next == null) {
			return;
		}
		if (next != StudentStatus.APPROVED && next != StudentStatus.REJECTED) {
			return;
		}
		if (previous == next) {
			return;
		}
		ApplicationHistory entry = new ApplicationHistory();
		entry.setStudent(student);
		entry.setStatus(next);
		entry.setRemarks(remarks);
		applicationHistoryRepository.save(entry);
	}

	private String generateAccountId() {
		LocalDate today = LocalDate.now();
		String yearSuffix = String.format("%02d", today.getYear() % 100);
		int sequential = determineNextSequential(yearSuffix);
		while (true) {
			String sequentialPart = String.format("%04d", sequential);
			int checksum = computeChecksum(today.getYear(), sequential);
			String candidate = String.format("%s-%s-%03d", yearSuffix, sequentialPart, checksum);
			if (!studentRepository.existsByAccountId(candidate)) {
				return candidate;
			}
			sequential++;
		}
	}

	private int determineNextSequential(String yearSuffix) {
		String prefix = yearSuffix + "-";
		Student latest = studentRepository.findTopByAccountIdStartingWithOrderByAccountIdDesc(prefix);
		if (latest == null || latest.getAccountId() == null) {
			return 1;
		}
		String[] parts = latest.getAccountId().split("-");
		if (parts.length < 2 || !yearSuffix.equals(parts[0])) {
			return 1;
		}
		try {
			return Integer.parseInt(parts[1]) + 1;
		} catch (NumberFormatException ex) {
			return 1;
		}
	}

	private int computeChecksum(int year, int sequential) {
		int base = ((year % 100) * 10000) + sequential;
		return Math.floorMod(base, 1000);
	}

	// Return currently authenticated admin basic profile (excluding password)
	@GetMapping("/me")
	public ResponseEntity<?> getMyAdmin(@AuthenticationPrincipal ClasslinkUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
		}
		Admin admin = adminRepository.findById(principal.getUserId()).orElse(null);
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
			@AuthenticationPrincipal ClasslinkUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
		}
		Admin admin = adminRepository.findById(principal.getUserId()).orElse(null);
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
	public ResponseEntity<?> updateMyAdmin(@RequestBody Map<String, String> body,
			@AuthenticationPrincipal ClasslinkUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
		}
		Admin admin = adminRepository.findById(principal.getUserId()).orElse(null);
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

	@GetMapping("/accounts")
	public ResponseEntity<?> listAdminAccounts() {
		List<AdminAccountDto> admins = adminRepository.findAll().stream()
				.filter(Admin::isActive)
				.filter(admin -> admin.getEmail() != null && !admin.getEmail().isBlank())
				.sorted(Comparator.comparing(Admin::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
				.map(this::toAdminAccountDto)
				.collect(Collectors.toList());
		return ResponseEntity.ok(admins);
	}

	@PostMapping("/accounts")
	public ResponseEntity<?> createAdminAccount(@RequestBody AdminAccountDto body) {
		if (body == null) {
			return ResponseEntity.badRequest().body("Request body is required");
		}
		String email = body.getEmail() != null ? body.getEmail().trim() : "";
		String password = body.getPassword() != null ? body.getPassword().trim() : "";
		String name = body.getName() != null ? body.getName().trim() : "";
		if (email.isEmpty() || password.isEmpty()) {
			return ResponseEntity.badRequest().body("Email and password are required");
		}
		Admin existing = adminRepository.findByEmail(email);
		if (existing != null) {
			if (!existing.isActive()) {
				// Reactivate previously removed admin accounts so rosters stay reusable
				existing.setActive(true);
				existing.setRemovedBy(null);
				existing.setPassword(password);
				existing.setRole("ADMIN");
				existing.setName(name.isEmpty() ? email : name);
				Admin reactivated = adminRepository.save(existing);
				return ResponseEntity.ok(toAdminAccountDto(reactivated));
			}
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
		}
		Admin admin = new Admin();
		admin.setEmail(email);
		admin.setPassword(password);
		admin.setName(name.isEmpty() ? email : name);
		admin.setRole("ADMIN");
		admin.setActive(true);
		admin.setRemovedBy(null);
		if (admin.getCreatedAt() == null) {
			admin.setCreatedAt(LocalDateTime.now());
		}
		try {
			Admin saved = adminRepository.save(admin);
			AdminAccountDto response = toAdminAccountDto(saved);
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (DataIntegrityViolationException ex) {
			log.error("Failed to create admin {} due to data integrity issue", email, ex);
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("Unable to save admin account. Please double-check the details and try again.");
		} catch (Exception ex) {
			log.error("Failed to create admin {}", email, ex);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Failed to save admin account. Please try again.");
		}
	}

	@DeleteMapping("/accounts")
	public ResponseEntity<?> removeAdminAccount(@RequestBody RemoveAdminAccountRequest request,
			@AuthenticationPrincipal ClasslinkUserDetails principal) {
		if (request == null || request.email() == null || request.password() == null) {
			return ResponseEntity.badRequest().body("Email and password are required");
		}
		String email = request.email().trim();
		String password = request.password().trim();
		if (email.isEmpty() || password.isEmpty()) {
			return ResponseEntity.badRequest().body("Email and password are required");
		}
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
		}
		Admin currentAdmin = adminRepository.findById(principal.getUserId()).orElse(null);
		if (currentAdmin == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Current admin record not found");
		}
		if (!password.equals(currentAdmin.getPassword())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password is incorrect");
		}
		Admin target = adminRepository.findByEmail(email);
		if (target == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin account not found");
		}
		if (!target.isActive()) {
			return ResponseEntity.badRequest().body("Admin account is already removed");
		}
		String removerName = currentAdmin.getName();
		if (removerName == null || removerName.isBlank()) {
			removerName = currentAdmin.getEmail();
		}
		target.setActive(false);
		target.setRemovedBy(removerName);
		adminRepository.save(target);
		return ResponseEntity.ok(Map.of("removedBy", removerName));
	}

	private AdminAccountDto toAdminAccountDto(Admin admin) {
		AdminAccountDto dto = new AdminAccountDto();
		dto.setId(admin.getAdminId());
		dto.setEmail(admin.getEmail());
		dto.setPassword(admin.getPassword());
		dto.setName(admin.getName() != null && !admin.getName().isBlank() ? admin.getName() : admin.getEmail());
		dto.setCreatedAt(admin.getCreatedAt());
		return dto;
	}

	private String capitalizeFirstLetter(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		if (trimmed.isEmpty()) {
			return value;
		}
		return trimmed.substring(0, 1).toUpperCase() + trimmed.substring(1);
	}

}
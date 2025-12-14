package com.classlink.server.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.classlink.server.model.ApplicantType;
import com.classlink.server.model.ApplicationHistory;
import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.ApplicationHistoryRepository;
import com.classlink.server.repository.DepartmentRepository;
import com.classlink.server.repository.ProgramRepository;
import com.classlink.server.repository.StudentRepository;
import com.classlink.server.security.ClasslinkUserDetails;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;
    private final ApplicationHistoryRepository applicationHistoryRepository;
    private final Logger log = LoggerFactory.getLogger(StudentController.class);
    private static final int MAX_PHONE_LENGTH = 11;
    private static final long MAX_REQUIREMENTS_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    public StudentController(StudentRepository studentRepository, ProgramRepository programRepository,
            DepartmentRepository departmentRepository, ApplicationHistoryRepository applicationHistoryRepository) {
        this.studentRepository = studentRepository;
        this.programRepository = programRepository;
        this.departmentRepository = departmentRepository;
        this.applicationHistoryRepository = applicationHistoryRepository;
    }

    // Use a Map<String, Object> for flexibility or a dedicated DTO class
    // Using a Map here to avoid strict record parsing issues if fields are
    // missing/null
    @PutMapping("/me")
    public ResponseEntity<?> updateStudentApplication(@RequestBody Map<String, Object> body,
            @AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long userId = resolveStudentId(principal);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student access required.");
        }
        log.info("Received application update for student {}", userId);

        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
        }

        StudentStatus currentStatus = student.getStatus();
        // Only treat the application as locked when it is actively under review (PENDING).
        boolean hasLockedApplication = currentStatus == StudentStatus.PENDING;
        if (hasLockedApplication) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Your application is under review. Please wait for the admin decision before making changes.");
        }

        // Update simple fields
        if (body.containsKey("firstName"))
            student.setFirstName((String) body.get("firstName"));
        if (body.containsKey("lastName"))
            student.setLastName((String) body.get("lastName"));

        if (body.get("birthDate") != null && !String.valueOf(body.get("birthDate")).isEmpty()) {
            student.setBirthDate(LocalDate.parse((String) body.get("birthDate")));
        }

        if (body.containsKey("gender"))
            student.setGender((String) body.get("gender"));
        if (body.containsKey("studentAddress"))
            student.setStudentAddress(asTrimmedString(body.get("studentAddress")));

        String contactNumber = asTrimmedString(body.get("contactNumber"));
        if (contactNumber != null) {
            if (contactNumber.length() > MAX_PHONE_LENGTH) {
                return ResponseEntity.badRequest().body("Contact number must not exceed 11 characters.");
            }
            student.setContactNumber(contactNumber);
        }
        if (body.containsKey("emailAddress"))
            student.setEmail((String) body.get("emailAddress")); // Update email

        if (body.containsKey("parentGuardianName"))
            student.setParentGuardianName(asTrimmedString(body.get("parentGuardianName")));
        if (body.containsKey("relationshipToStudent"))
            student.setRelationshipToStudent(asTrimmedString(body.get("relationshipToStudent")));

        String parentContact = asTrimmedString(body.get("parentContactNumber"));
        if (parentContact != null) {
            if (parentContact.length() > MAX_PHONE_LENGTH) {
                return ResponseEntity.badRequest().body("Parent/guardian contact must not exceed 11 characters.");
            }
            student.setParentContactNumber(parentContact);
        }

        if (body.containsKey("parentEmailAddress"))
            student.setParentEmailAddress(asTrimmedString(body.get("parentEmailAddress")));
        if (body.containsKey("previousSchool"))
            student.setPreviousSchool(asTrimmedString(body.get("previousSchool")));

        if (body.containsKey("yearLevel") && body.get("yearLevel") != null) {
            student.setYearLevel(((Number) body.get("yearLevel")).intValue());
        }
        if (body.containsKey("semester"))
            student.setSemester((String) body.get("semester"));

        if (body.containsKey("applicantType")) {
            String rawType = asTrimmedString(body.get("applicantType"));
            if (rawType == null || rawType.isEmpty()) {
                student.setApplicantType(null);
            } else {
                try {
                    student.setApplicantType(ApplicantType.valueOf(rawType.toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body("Invalid applicant type.");
                }
            }
        }

        // Handle Program and Department
        // Frontend sends 'programId' and 'departmentId'
        if (body.get("programId") != null) {
            Long pId = ((Number) body.get("programId")).longValue();
            programRepository.findById(pId).ifPresent(student::setProgram);
        }

        if (body.get("departmentId") != null) {
            Long dId = ((Number) body.get("departmentId")).longValue();
            departmentRepository.findById(dId).ifPresent(student::setDepartment);
        }

        // Set status to PENDING for admin review
        student.setStatus(StudentStatus.PENDING);

        Student savedStudent = studentRepository.save(student);
        log.info("Student {} application updated successfully.", userId);
        return ResponseEntity.ok(savedStudent);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyStudent(@AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long userId = resolveStudentId(principal);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student access required.");
        }
        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
        return ResponseEntity.ok(student);
    }

    @GetMapping("/me/history")
    public ResponseEntity<?> getMyHistory(@AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long userId = resolveStudentId(principal);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student access required.");
        }
        List<ApplicationHistory> entries = applicationHistoryRepository.findAllByStudentIdOrderByChangedAtDesc(userId);
        List<Map<String, Object>> payload = new ArrayList<>();
        for (ApplicationHistory entry : entries) {
            if (entry.getStatus() != StudentStatus.APPROVED && entry.getStatus() != StudentStatus.REJECTED) {
                continue;
            }
            Map<String, Object> row = new HashMap<>();
            row.put("id", entry.getId());
            row.put("status", entry.getStatus());
            row.put("remarks", entry.getRemarks());
            row.put("processedBy", entry.getProcessedBy());
            row.put("changedAt", entry.getChangedAt());
            payload.add(row);
        }
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/me/profile-image")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long userId = resolveStudentId(principal);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student access required.");
        }
        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Empty file");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            return ResponseEntity.badRequest().body("File must be an image");
        }

        try {
            Path uploadRoot = Path.of("uploads", "profile");
            Files.createDirectories(uploadRoot);
            String extension = "";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                extension = original.substring(original.lastIndexOf('.'));
            }
            String filename = UUID.randomUUID() + extension;
            Path target = uploadRoot.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // Expose via /static/profile/{filename}
        String relative = "/static/profile/" + filename;
        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path(relative)
            .toUriString();
            student.setProfileImageUrl(url);
            studentRepository.save(student);
            return ResponseEntity.ok(Map.of("profileImageUrl", url));
        } catch (IOException e) {
            log.error("Failed to store profile image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not store image");
        }
    }

    @PostMapping("/me/requirements")
    public ResponseEntity<?> uploadRequirementsDocument(@RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal ClasslinkUserDetails principal) {
        Long userId = resolveStudentId(principal);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student access required.");
        }
        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Empty file");
        }
        if (file.getSize() > MAX_REQUIREMENTS_FILE_SIZE) {
            return ResponseEntity.badRequest().body("File exceeds 10 MB limit");
        }
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        boolean isPdf = (contentType != null && contentType.equalsIgnoreCase("application/pdf"))
                || (filename != null && filename.toLowerCase().endsWith(".pdf"));
        if (!isPdf) {
            return ResponseEntity.badRequest().body("Requirements file must be a PDF");
        }

        try {
            Path uploadRoot = Path.of("uploads", "requirements");
            Files.createDirectories(uploadRoot);
            String extension = ".pdf";
            if (filename != null && filename.contains(".")) {
                extension = filename.substring(filename.lastIndexOf('.'));
            }
            String storedName = UUID.randomUUID() + extension;
            Path target = uploadRoot.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String relative = "/static/requirements/" + storedName;
            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(relative)
                    .toUriString();
            student.setRequirementsDocumentUrl(url);
            studentRepository.save(student);
            return ResponseEntity.ok(Map.of("requirementsDocumentUrl", url));
        } catch (IOException e) {
            log.error("Failed to store requirements document", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not store requirements file");
        }
    }

    private String asTrimmedString(Object value) {
        if (value == null) {
            return null;
        }
        return value.toString().trim();
    }

	private Long resolveStudentId(ClasslinkUserDetails principal) {
		if (principal == null || !principal.isStudent()) {
			return null;
		}
		return principal.getUserId();
	}
}
package com.classlink.server.controller;

import java.net.URI;
import java.util.Date;
import java.util.Optional;
import java.util.List; // ADDED: Required import for List

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Course;
import com.classlink.server.model.Enrollment;
import com.classlink.server.model.EnrollmentForm;
import com.classlink.server.model.Student;
import com.classlink.server.repository.EnrollmentRepository;
import com.classlink.server.repository.EnrollmentFormRepository; // Added this import
import com.classlink.server.repository.StudentRepository;
import com.classlink.server.security.ClasslinkUserDetails;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final com.classlink.server.repository.CourseRepository courseRepository;
    // ASSUMPTION: You use EnrollmentFormRepository for EnrollmentForm entities
    private final EnrollmentFormRepository enrollmentFormRepository;

    public EnrollmentController(EnrollmentRepository enrollmentRepository,
            StudentRepository studentRepository,
            com.classlink.server.repository.CourseRepository courseRepository,
            // You might need to inject the EnrollmentFormRepository here if it's not done
            // already
            EnrollmentFormRepository enrollmentFormRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentFormRepository = enrollmentFormRepository; // Initialize it
    }

    @GetMapping("/forms")
    public ResponseEntity<?> getFilteredEnrollmentForms(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String program,
            @RequestParam(required = false) Integer yearLevel,
            @RequestParam(required = false) String semester,
            @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }

        // Delegate the filtering logic to the custom repository method.
        List<EnrollmentForm> filteredForms = enrollmentFormRepository.findFormsByFilters(
                department,
                program,
                yearLevel,
                semester);

        return ResponseEntity.ok(filteredForms);
    }

    @GetMapping
    public ResponseEntity<?> getAllEnrollments(@AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        return ResponseEntity.ok(enrollmentRepository.findAll());
    }

    // Minimal DTO expected: { "studentName": "Full Name", "courseId": 1 }
    @PostMapping
    public ResponseEntity<?> createEnrollment(@RequestBody EnrollmentRequest req,
                                              @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
            Student student = new Student();
        // Example splits; in production parse names properly
        if (req.getStudentName() != null) {
            String[] parts = req.getStudentName().split(" ", 2);
            student.setFirstName(parts[0]);
            student.setLastName(parts.length > 1 ? parts[1] : "");
        }
        student = studentRepository.save(student);

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        if (req.getCurriculumId() != null) {
            Optional<Course> c = courseRepository.findById(req.getCurriculumId());
            c.ifPresent(enrollment::setCourse);
        }
        enrollment.setStatus("enrolled");
        enrollment.setDateEnrolled(new Date());
        Enrollment saved = enrollmentRepository.save(enrollment);
        return ResponseEntity.created(URI.create("/api/enrollments/" + saved.getEnrollmentID())).body(saved);
    }

        public static class EnrollmentRequest {
        private String studentName;
        private Long curriculumId;

        public String getStudentName() {
            return studentName;
        }

        public void setStudentName(String studentName) {
            this.studentName = studentName;
        }

        public Long getCurriculumId() {
            return curriculumId;
        }

        public void setCurriculumId(Long curriculumId) {
            this.curriculumId = curriculumId;
        }
    }

    private boolean isAdmin(ClasslinkUserDetails principal) {
        return principal != null && "ADMIN".equalsIgnoreCase(principal.getRole());
    }
}
package com.classlink.server.controller;

import com.classlink.server.model.Course;
import com.classlink.server.model.Enrollment;
import com.classlink.server.model.Student;
import com.classlink.server.repository.CourseRepository;
import com.classlink.server.repository.EnrollmentRepository;
import com.classlink.server.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Optional;
import java.util.Date;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentController(EnrollmentRepository enrollmentRepository,
                                StudentRepository studentRepository,
                                CourseRepository courseRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAllEnrollments() {
        return ResponseEntity.ok(enrollmentRepository.findAll());
    }

    // Minimal DTO expected: { "studentName": "Full Name", "courseId": 1 }
    @PostMapping
    public ResponseEntity<?> createEnrollment(@RequestBody EnrollmentRequest req) {
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
        if (req.getCourseId() != null) {
            Optional<Course> c = courseRepository.findById(req.getCourseId());
            c.ifPresent(enrollment::setCourse);
        }
    enrollment.setStatus("enrolled");
    enrollment.setDateEnrolled(new Date());
        Enrollment saved = enrollmentRepository.save(enrollment);
        return ResponseEntity.created(URI.create("/api/enrollments/" + saved.getEnrollmentID())).body(saved);
    }

    public static class EnrollmentRequest {
        private String studentName;
        private Integer courseId;

        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public Integer getCourseId() { return courseId; }
        public void setCourseId(Integer courseId) { this.courseId = courseId; }
    }
}

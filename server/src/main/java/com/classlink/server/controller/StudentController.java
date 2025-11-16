package com.classlink.server.controller;

import com.classlink.server.model.Student;
import com.classlink.server.repository.StudentRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;

    public StudentController(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    // DTO for receiving the application form data
    public record StudentApplicationRequest(
            String firstName,
            String lastName,
            LocalDate birthDate,
            String gender,
            String studentAddress,
            String contactNumber,
            String emailAddress,
            String parentGuardianName,
            String relationshipToStudent,
            String parentContactNumber,
            String parentEmailAddress,
            String gradeProgramApplyingFor,
            String previousSchool) {
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateStudentApplication(@RequestBody StudentApplicationRequest body,
            HttpSession session) {
        // 1. Get the logged-in student's ID from the session
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not logged in.");
        }

        // Ensure the ID is treated as Long, which matches the Student model
        Long userId;
        if (userIdObj instanceof Integer) {
            userId = ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            userId = (Long) userIdObj;
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Invalid session user ID format.");
        }

        // 2. Find the student in the database
        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
        }

        // 3. Update the student record with data from the form
        student.setFirstName(body.firstName());
        student.setLastName(body.lastName());
        student.setBirthDate(body.birthDate());
        student.setGender(body.gender());
        student.setStudentAddress(body.studentAddress());
        student.setContactNumber(body.contactNumber());
        student.setEmail(body.emailAddress()); // Update email if it changed
        student.setParentGuardianName(body.parentGuardianName());
        student.setRelationshipToStudent(body.relationshipToStudent());
        student.setParentContactNumber(body.parentContactNumber());
        student.setParentEmailAddress(body.parentEmailAddress());
        student.setGradeProgramApplyingFor(body.gradeProgramApplyingFor());
        student.setPreviousSchool(body.previousSchool());

        // 4. Save the updated record
        Student savedStudent = studentRepository.save(student);
        return ResponseEntity.ok(savedStudent);
    }
}
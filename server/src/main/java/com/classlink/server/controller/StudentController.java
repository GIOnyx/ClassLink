package com.classlink.server.controller;

import java.time.LocalDate;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.DepartmentRepository;
import com.classlink.server.repository.ProgramRepository;
import com.classlink.server.repository.StudentRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;
    private final Logger log = LoggerFactory.getLogger(StudentController.class);

    public StudentController(StudentRepository studentRepository, ProgramRepository programRepository,
            DepartmentRepository departmentRepository) {
        this.studentRepository = studentRepository;
        this.programRepository = programRepository;
        this.departmentRepository = departmentRepository;
    }

    // Use a Map<String, Object> for flexibility or a dedicated DTO class
    // Using a Map here to avoid strict record parsing issues if fields are
    // missing/null
    @PutMapping("/me")
    public ResponseEntity<?> updateStudentApplication(@RequestBody Map<String, Object> body, HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not logged in.");
        }

        Long userId = ((Number) userIdObj).longValue();
        log.info("Received application update for student {}", userId);

        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
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
            student.setStudentAddress((String) body.get("studentAddress"));
        if (body.containsKey("contactNumber"))
            student.setContactNumber((String) body.get("contactNumber"));
        if (body.containsKey("emailAddress"))
            student.setEmail((String) body.get("emailAddress")); // Update email

        if (body.containsKey("parentGuardianName"))
            student.setParentGuardianName((String) body.get("parentGuardianName"));
        if (body.containsKey("relationshipToStudent"))
            student.setRelationshipToStudent((String) body.get("relationshipToStudent"));
        if (body.containsKey("parentContactNumber"))
            student.setParentContactNumber((String) body.get("parentContactNumber"));
        if (body.containsKey("parentEmailAddress"))
            student.setParentEmailAddress((String) body.get("parentEmailAddress"));
        if (body.containsKey("previousSchool"))
            student.setPreviousSchool((String) body.get("previousSchool"));

        if (body.containsKey("yearLevel") && body.get("yearLevel") != null) {
            student.setYearLevel(((Number) body.get("yearLevel")).intValue());
        }
        if (body.containsKey("semester"))
            student.setSemester((String) body.get("semester"));

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
    public ResponseEntity<?> getMyStudent(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not logged in.");
        }
        Long userId = ((Number) userIdObj).longValue();
        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
        return ResponseEntity.ok(student);
    }
}
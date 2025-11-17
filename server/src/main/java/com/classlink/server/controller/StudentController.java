package com.classlink.server.controller;

import com.classlink.server.model.Student;
import com.classlink.server.repository.StudentRepository;
import com.classlink.server.repository.ProgramRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.model.Department;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final ProgramRepository programRepository;
    private final com.classlink.server.repository.DepartmentRepository departmentRepository;
    private final Logger log = LoggerFactory.getLogger(StudentController.class);

    public StudentController(StudentRepository studentRepository, ProgramRepository programRepository, com.classlink.server.repository.DepartmentRepository departmentRepository) {
        this.studentRepository = studentRepository;
        this.programRepository = programRepository;
        this.departmentRepository = departmentRepository;
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
            Long programId,
            java.util.Map<String, Object> program,
            Long departmentId,
            String previousSchool,
            Integer yearLevel,
            String semester) {
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

        log.info("Received student application update: programId={}, email={}", body.programId(), body.emailAddress());

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
        student.setPreviousSchool(body.previousSchool());
        // year level and semester
        if (body.yearLevel() != null) student.setYearLevel(body.yearLevel());
        if (body.semester() != null) student.setSemester(body.semester());
        // set program relation if provided (accept either programId or nested program object)
        Long resolvedProgramId = body.programId();
        if (resolvedProgramId == null && body.program() != null) {
            Object maybeId = body.program().get("id");
            if (maybeId instanceof Number) {
                resolvedProgramId = ((Number) maybeId).longValue();
            } else if (maybeId instanceof String) {
                try { resolvedProgramId = Long.valueOf((String) maybeId); } catch (NumberFormatException ex) { /* ignore */ }
            }
        }

        if (resolvedProgramId != null) {
            Long finalProgId = resolvedProgramId;
            programRepository.findById(finalProgId).ifPresentOrElse(p -> {
                student.setProgram(p);
                // also set department based on program's department
                if (p.getDepartment() != null) {
                    student.setDepartment(p.getDepartment());
                }
                log.info("Linked student {} to program id={} name={}", userId, p.getId(), p.getName());
            }, () -> {
                log.warn("Program id {} not found; leaving program null for student {}", finalProgId, userId);
                student.setProgram(null);
            });
        } else {
            student.setProgram(null);
        }

        // if frontend explicitly provided departmentId, prefer that
        if (body.departmentId() != null) {
            departmentRepository.findById(body.departmentId()).ifPresent(student::setDepartment);
        }

        // 4. Save the updated record
        // Mark as PENDING so admins can review submitted applications
        student.setStatus(StudentStatus.PENDING);
        Student savedStudent = studentRepository.save(student);
        if (savedStudent.getProgram() != null) {
            log.info("After save: student {} program persisted id={} name={}", savedStudent.getId(), savedStudent.getProgram().getId(), savedStudent.getProgram().getName());
        } else {
            log.info("After save: student {} program is still null", savedStudent.getId());
        }
        return ResponseEntity.ok(savedStudent);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyStudent(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not logged in.");
        }

        Long userId;
        if (userIdObj instanceof Integer) {
            userId = ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            userId = (Long) userIdObj;
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Invalid session user ID format.");
        }

        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student record not found.");
        return ResponseEntity.ok(student);
    }
}

package com.classlink.server.controller;

import java.net.URI;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Teacher;
import com.classlink.server.repository.TeacherRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/teachers")
// ✅ The @CrossOrigin annotation has been REMOVED to use the global
// CorsConfig.java
public class TeacherController {

    private final TeacherRepository teacherRepository;

    public TeacherController(TeacherRepository teacherRepository) {
        this.teacherRepository = teacherRepository;
    }

    // Helper to check for Admin role
    private boolean isAdmin(HttpSession session) {
        Object role = session.getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }

    // GET /api/teachers - Get all teachers
    @GetMapping
    public ResponseEntity<?> getAllTeachers(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
        }
        return ResponseEntity.ok(teacherRepository.findAll());
    }

    // POST /api/teachers - Create a new teacher
    @PostMapping
    public ResponseEntity<?> createTeacher(@RequestBody Teacher teacher, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
        }
        if (teacher.getName() == null || teacher.getEmail() == null) {
            return ResponseEntity.badRequest().body("Name and email are required");
        }
        // Check for duplicate email
        if (teacherRepository.findByEmail(teacher.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use");
        }
        Teacher saved = teacherRepository.save(teacher);
        return ResponseEntity.created(URI.create("/api/teachers/" + saved.getTeacherId())).body(saved);
    }

    // PUT /api/teachers/{id} - Update a teacher
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @RequestBody Teacher updatedTeacher,
            HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
        }
        Optional<Teacher> optionalTeacher = teacherRepository.findById(id);
        if (optionalTeacher.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Teacher not found");
        }
        Teacher existingTeacher = optionalTeacher.get();

        // Check if email is being changed to one that already exists
        if (updatedTeacher.getEmail() != null && !updatedTeacher.getEmail().equals(existingTeacher.getEmail())) {
            if (teacherRepository.findByEmail(updatedTeacher.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use by another teacher");
            }
        }

        existingTeacher.setName(updatedTeacher.getName());
        existingTeacher.setEmail(updatedTeacher.getEmail());
        Teacher saved = teacherRepository.save(existingTeacher);
        return ResponseEntity.ok(saved);
    }

    // DELETE /api/teachers/{id} - Delete a teacher
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin role required");
        }
        if (!teacherRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Teacher not found");
        }
        // You might want to add logic here to unassign courses before deleting
        teacherRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
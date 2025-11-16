package com.classlink.server.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Course;
import com.classlink.server.model.Teacher;
import com.classlink.server.repository.CourseRepository;
import com.classlink.server.repository.TeacherRepository;

@RestController
@RequestMapping("/api/courses")
// ✅ The @CrossOrigin annotation has been REMOVED to use the global
// CorsConfig.java
public class CourseController {

    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;

    public CourseController(CourseRepository courseRepository, TeacherRepository teacherRepository) {
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
    }

    @GetMapping
    public List<Course> getAll(@RequestParam(name = "programId", required = false) Optional<Long> programId) {
        return programId
                .map(courseRepository::findByProgramId)
                .orElseGet(courseRepository::findAll);
    }

    @PostMapping
    public ResponseEntity<Course> create(@RequestBody Course course) {
        // The incoming 'course' object might have an 'assignedTeacher'
        // with just an ID set. We need to fetch the full teacher object.
        if (course.getAssignedTeacher() != null && course.getAssignedTeacher().getTeacherId() != null) {
            Optional<Teacher> teacher = teacherRepository.findById(course.getAssignedTeacher().getTeacherId());
            teacher.ifPresent(course::setAssignedTeacher); // Set the managed Teacher entity
        }

        Course saved = courseRepository.save(course);
        return ResponseEntity.created(URI.create("/api/courses/" + saved.getCourseID())).body(saved);
    }
}
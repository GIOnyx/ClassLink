package com.classlink.server.controller;

import com.classlink.server.model.Course;
import com.classlink.server.repository.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @GetMapping
    public List<Course> getAll(@RequestParam(name = "program", required = false) Optional<String> program) {
        return program.filter(p -> !p.isBlank())
                .map(courseRepository::findByProgramIgnoreCase)
                .orElseGet(courseRepository::findAll);
    }

    @PostMapping
    public ResponseEntity<Course> create(@RequestBody Course course) {
        Course saved = courseRepository.save(course);
        return ResponseEntity.created(URI.create("/api/courses/" + saved.getCourseID())).body(saved);
    }
}

package com.classlink.server.controller;

import com.classlink.server.model.Curriculum;
import com.classlink.server.repository.CurriculumRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/curricula")
public class CurriculumController {

    private final CurriculumRepository curriculumRepository;

    public CurriculumController(CurriculumRepository curriculumRepository) {
        this.curriculumRepository = curriculumRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(curriculumRepository.findAll());
    }

    @GetMapping("/{programCode}")
    public ResponseEntity<?> getByProgram(@PathVariable String programCode) {
        // Try exact program code first
        Optional<Curriculum> cur = curriculumRepository.findByProgramCode(programCode);
        if (cur.isPresent()) return ResponseEntity.ok(cur.get());

        // Try exact program name
        cur = curriculumRepository.findByProgramName(programCode);
        if (cur.isPresent()) return ResponseEntity.ok(cur.get());

        // Try formatted match like "CODE - Program Name"
        String normalized = programCode.trim();
        Optional<Curriculum> found = curriculumRepository.findAll().stream()
                .filter(c -> {
                    String combined = (c.getProgramCode() == null ? "" : c.getProgramCode()) + " - " + (c.getProgramName() == null ? "" : c.getProgramName());
                    return combined.equalsIgnoreCase(normalized) || c.getProgramCode().equalsIgnoreCase(normalized) || (c.getProgramName() != null && c.getProgramName().equalsIgnoreCase(normalized));
                })
                .findFirst();

        return found.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Curriculum c) {
        Curriculum saved = curriculumRepository.save(c);
        return ResponseEntity.ok(saved);
    }
}

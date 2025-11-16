package com.classlink.server.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.classlink.server.repository.ProgramRepository;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramRepository programRepository;

    public ProgramController(ProgramRepository programRepository) {
        this.programRepository = programRepository;
    }

    @GetMapping
    public Object list(@RequestParam(name = "departmentId", required = false) Long departmentId) {
        if (departmentId == null) return programRepository.findAll();
        return programRepository.findAllByDepartmentId(departmentId);
    }
}

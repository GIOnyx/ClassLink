package com.classlink.server.controller;

import com.classlink.server.model.Curriculum;
import com.classlink.server.model.Course;
import com.classlink.server.repository.CurriculumRepository;
import com.classlink.server.repository.CourseRepository;
import com.classlink.server.repository.ProgramRepository;
import com.classlink.server.repository.DepartmentRepository;
import com.classlink.server.model.Department;
import com.classlink.server.model.Program;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Map;
import java.util.List;
import java.util.Comparator;

import com.classlink.server.security.ClasslinkUserDetails;

@RestController
@RequestMapping("/api/curricula")
public class CurriculumController {

    private final CurriculumRepository curriculumRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;

    public CurriculumController(CurriculumRepository curriculumRepository, ProgramRepository programRepository, DepartmentRepository departmentRepository, CourseRepository courseRepository) {
        this.curriculumRepository = curriculumRepository;
        this.programRepository = programRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
    }

    private static final String[] YEAR_LABELS = new String[]{
            "First Year",
            "Second Year",
            "Third Year",
            "Fourth Year",
            "Fifth Year",
            "Sixth Year"
    };

    private Integer parseYearLabel(Object labelObj) {
        if (labelObj == null) {
            return null;
        }
        String raw = String.valueOf(labelObj).trim();
        if (raw.isEmpty()) {
            return null;
        }
        String normalized = raw.toLowerCase();
        for (int i = 0; i < YEAR_LABELS.length; i++) {
            String candidate = YEAR_LABELS[i].toLowerCase();
            if (candidate.equals(normalized) || normalized.contains(candidate)) {
                return i + 1;
            }
        }
        if (normalized.endsWith("year")) {
            normalized = normalized.substring(0, normalized.length() - 4).trim();
        }
        try {
            return Integer.valueOf(normalized.replaceAll("[^0-9]", ""));
        } catch (Exception ignore) {
            return null;
        }
    }

    private String toYearLabel(Integer year) {
        if (year == null || year <= 0) {
            return null;
        }
        if (year <= YEAR_LABELS.length) {
            return YEAR_LABELS[year - 1];
        }
        return year + "th Year";
    }

    private int yearOrder(Integer year) {
        return year != null && year > 0 ? year : Integer.MAX_VALUE;
    }

    private int termOrder(String term) {
        if (term == null) {
            return Integer.MAX_VALUE;
        }
        String normalized = term.trim().toLowerCase();
        if (normalized.isEmpty()) {
            return Integer.MAX_VALUE;
        }
        String[] labels = new String[]{"first", "second", "third", "fourth", "fifth", "sixth"};
        for (int i = 0; i < labels.length; i++) {
            if (normalized.startsWith(labels[i])) {
                return i + 1;
            }
        }
        try {
            return Integer.parseInt(normalized.replaceAll("[^0-9]", ""));
        } catch (Exception ignore) {
            return Integer.MAX_VALUE;
        }
    }

    private String resolveTermLabel(Course course) {
        String semester = course.getSemester();
        if (semester != null && !semester.isBlank()) {
            return semester;
        }
        String termTitle = course.getTermTitle();
        return termTitle == null || termTitle.isBlank() ? null : termTitle;
    }

    private Map<String, Object> courseToDto(Course course) {
        Map<String, Object> dto = new java.util.LinkedHashMap<>();
        dto.put("id", course.getId());
        dto.put("subjectCode", course.getSubjectCode());
        dto.put("description", course.getDescription());
        dto.put("equivSubjectCode", course.getEquivSubjectCode());
        dto.put("prerequisite", course.getPrerequisite());
        String semester = resolveTermLabel(course);
        dto.put("semester", semester);
        dto.put("termTitle", course.getTermTitle());
        dto.put("units", course.getUnits());
        dto.put("year", course.getYear());
        String yearLabel = toYearLabel(course.getYear());
        dto.put("yearLabel", yearLabel != null ? yearLabel : "Unknown Year");
        return dto;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            var progs = programRepository.findAll();
            var out = progs.stream().map(p -> {
                java.util.Map<String,Object> m = new java.util.HashMap<>();
                m.put("programId", p.getId());
                m.put("programName", p.getName());
                m.put("durationInYears", p.getDurationInYears());
                if (p.getDepartment() != null) m.put("department", java.util.Map.of("id", p.getDepartment().getId(), "name", p.getDepartment().getName()));
                int itemsCount = courseRepository.findAllByProgram_Id(p.getId()).size();
                m.put("itemsCount", itemsCount);
                return m;
            }).toList();
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            System.err.println("Error listing curricula: " + ex.getMessage());
            return ResponseEntity.status(500).body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{programIdentifier}")
    public ResponseEntity<?> getByProgram(@PathVariable String programIdentifier) {
        String normalized = programIdentifier.trim();
        Optional<Program> maybeProg = programRepository.findAll().stream()
                .filter(p -> p.getName() != null && (p.getName().equalsIgnoreCase(normalized) || p.getName().trim().equalsIgnoreCase(normalized)))
                .findFirst();

        if (maybeProg.isPresent()) {
            Program prog = maybeProg.get();
            var items = courseRepository.findAllByProgram_Id(prog.getId());
                var dtoItems = items.stream()
                    .sorted(Comparator
                        .comparing((Course c) -> yearOrder(c.getYear()))
                        .thenComparing(c -> termOrder(resolveTermLabel(c)))
                    .thenComparing(Course::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::courseToDto)
                .toList();
            java.util.Map<String,Object> out = new java.util.HashMap<>();
            out.put("program", java.util.Map.of("id", prog.getId(), "name", prog.getName(), "durationInYears", prog.getDurationInYears()));
            out.put("department", prog.getDepartment() == null ? null : java.util.Map.of("id", prog.getDepartment().getId(), "name", prog.getDepartment().getName()));
                out.put("programId", prog.getId());
                out.put("programName", prog.getName());
                out.put("programCode", prog.getName());
                out.put("durationInYears", prog.getDurationInYears());
                if (prog.getDepartment() != null) {
                    out.put("departmentId", prog.getDepartment().getId());
                }
                var versions = curriculumRepository.findAllByProgram_Id(prog.getId());
                Curriculum version = versions.isEmpty() ? null : versions.get(0);
                if (version != null) {
                    out.put("curriculumId", version.getId());
                    if (version.getVersionName() != null) out.put("curriculumVersionName", version.getVersionName());
                    if (version.getEffectivityYear() != null) out.put("effectivityYear", version.getEffectivityYear());
                    if (version.getDurationInYears() != null && out.get("durationInYears") == null) {
                        out.put("durationInYears", version.getDurationInYears());
                    }
                }
            out.put("items", dtoItems);
            return ResponseEntity.ok(out);
        }

        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> payload,
                                    @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        // Resolve department if provided
        Department d = null;
        try {
            Object deptObj = payload.get("department");
            if (deptObj instanceof Map) {
                Object didObj = ((Map<?,?>)deptObj).get("id");
                if (didObj != null) {
                    Long did = Long.valueOf(String.valueOf(didObj));
                    d = departmentRepository.findById(did).orElse(null);
                }
            }
        } catch (Exception ex) {
            d = null;
        }

        // Persist curriculum as part of Program (collapse Curriculum -> Program)
        String programName = payload.get("programName") == null ? null : String.valueOf(payload.get("programName"));
        String programCode = payload.get("programCode") == null ? null : String.valueOf(payload.get("programCode"));
        Program program = null;
        if (programName != null && !programName.isBlank()) {
            program = programRepository.findByName(programName).orElse(null);
        }
        if (program == null) program = new Program();

        // prefer programName; fall back to programCode
        if (programName != null && !programName.isBlank()) program.setName(programName);
        else if (programCode != null && !programCode.isBlank()) program.setName(programCode);

        Object durObj = payload.get("durationInYears");
        if (durObj != null) {
            try { program.setDurationInYears(Integer.valueOf(String.valueOf(durObj))); } catch (Exception ignore) {}
        }
        if (d != null) program.setDepartment(d);

        // Replace curriculum items on the Program by creating Course entities linked to a curriculum version
        Program savedProgram = programRepository.save(program);
        Object itemsObj = payload.get("items");
        if (itemsObj instanceof List) {
            // remove existing courses for this program
            var existing = courseRepository.findAllByProgram_Id(savedProgram.getId());
            if (existing != null && !existing.isEmpty()) {
                courseRepository.deleteAll(existing);
            }

            // ensure a default curriculum version exists
            java.util.List<Curriculum> versions = curriculumRepository.findAllByProgram_Id(savedProgram.getId());
            Curriculum version = versions.isEmpty() ? null : versions.get(0);
            if (version == null) {
                version = new Curriculum();
                version.setProgram(savedProgram);
                version.setVersionName("Imported - initial");
                version.setEffectivityYear(java.time.LocalDate.now().getYear());
                version.setDurationInYears(savedProgram.getDurationInYears());
                version = curriculumRepository.save(version);
            }

            List<Course> toSave = new java.util.ArrayList<>();
            for (Object itemObj : (List<?>)itemsObj) {
                if (!(itemObj instanceof Map)) continue;
                Map<?,?> it = (Map<?,?>) itemObj;
                String semester = it.get("semester") == null ? null : String.valueOf(it.get("semester"));
                String termTitle = it.get("termTitle") == null ? null : String.valueOf(it.get("termTitle"));
                if ((semester == null || semester.isBlank()) && termTitle != null) semester = termTitle;
                Integer year = parseYearLabel(it.get("yearLabel"));
                if (year == null && it.get("year") != null) {
                    try { year = Integer.valueOf(String.valueOf(it.get("year"))); } catch (Exception ignore) {}
                }

                Course newIt = new Course();
                newIt.setSemester(semester);
                newIt.setTermTitle(termTitle == null || termTitle.isBlank() ? semester : termTitle);
                newIt.setSubjectCode(it.get("subjectCode") == null ? null : String.valueOf(it.get("subjectCode")));
                newIt.setPrerequisite(it.get("prerequisite") == null ? null : String.valueOf(it.get("prerequisite")));
                newIt.setEquivSubjectCode(it.get("equivSubjectCode") == null ? null : String.valueOf(it.get("equivSubjectCode")));
                newIt.setDescription(it.get("description") == null ? null : String.valueOf(it.get("description")));
                try { newIt.setUnits(it.get("units") == null ? null : Integer.valueOf(String.valueOf(it.get("units")))); } catch (Exception ignore) {}
                newIt.setYear(year);
                newIt.setProgram(savedProgram);
                newIt.setCurriculum(version);
                toSave.add(newIt);
            }
            if (!toSave.isEmpty()) courseRepository.saveAll(toSave);
        }

        return ResponseEntity.ok(savedProgram);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody Map<String,Object> payload,
                                    @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        Optional<Curriculum> maybeCurriculum = curriculumRepository.findById(id);
        if (maybeCurriculum.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Curriculum curriculum = maybeCurriculum.get();
        Program program = curriculum.getProgram();

        Long payloadProgramId = null;
        Object programIdObj = payload.get("programId");
        if (programIdObj != null) {
            try {
                payloadProgramId = Long.valueOf(String.valueOf(programIdObj));
            } catch (Exception ignore) {
                payloadProgramId = null;
            }
        }

        if (payloadProgramId != null && (program == null || !payloadProgramId.equals(program.getId()))) {
            program = programRepository.findById(payloadProgramId).orElse(program);
            if (program == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Program not found for the provided programId."));
            }
            curriculum.setProgram(program);
        }

        if (program == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Curriculum is not linked to a program."));
        }

        String programName = payload.get("programName") == null ? null : String.valueOf(payload.get("programName"));
        String programCode = payload.get("programCode") == null ? null : String.valueOf(payload.get("programCode"));
        String desiredName = (programName != null && !programName.isBlank()) ? programName : programCode;
        if (desiredName == null || desiredName.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "programName or programCode required"));
        }

        program.setName(desiredName);

        Object durObj2 = payload.get("durationInYears");
        if (durObj2 != null) {
            try {
                Integer duration = Integer.valueOf(String.valueOf(durObj2));
                program.setDurationInYears(duration);
                curriculum.setDurationInYears(duration);
            } catch (Exception ignore) {
                // keep previous duration when conversion fails
            }
        }

        Department department = program.getDepartment();
        try {
            Object deptObj = payload.get("department");
            if (deptObj instanceof Map<?,?> deptMap) {
                Object didObj = deptMap.get("id");
                if (didObj != null) {
                    Long did = Long.valueOf(String.valueOf(didObj));
                    department = departmentRepository.findById(did).orElse(null);
                }
            }
        } catch (Exception ignore) {
            department = null;
        }
        program.setDepartment(department);

        Program savedProgram = programRepository.save(program);
        curriculum.setProgram(savedProgram);
        if (curriculum.getDurationInYears() == null && savedProgram.getDurationInYears() != null) {
            curriculum.setDurationInYears(savedProgram.getDurationInYears());
        }
        curriculumRepository.save(curriculum);

        Object itemsObj2 = payload.get("items");
        if (itemsObj2 instanceof List<?>) {
            var existing = courseRepository.findAllByProgram_Id(savedProgram.getId());
            if (existing != null && !existing.isEmpty()) {
                courseRepository.deleteAll(existing);
            }

            Curriculum version = curriculum;
            if (version.getVersionName() == null) {
                version.setVersionName("Imported - initial");
            }
            if (version.getEffectivityYear() == null) {
                version.setEffectivityYear(java.time.LocalDate.now().getYear());
            }
            if (version.getDurationInYears() == null) {
                version.setDurationInYears(savedProgram.getDurationInYears());
            }
            curriculumRepository.save(version);

            List<Course> toSave = new java.util.ArrayList<>();
            for (Object itemObj : (List<?>) itemsObj2) {
                if (!(itemObj instanceof Map<?,?> it)) continue;
                String semester = it.get("semester") == null ? null : String.valueOf(it.get("semester"));
                String termTitle = it.get("termTitle") == null ? null : String.valueOf(it.get("termTitle"));
                if ((semester == null || semester.isBlank()) && termTitle != null) semester = termTitle;
                Integer year = parseYearLabel(it.get("yearLabel"));
                if (year == null && it.get("year") != null) {
                    try { year = Integer.valueOf(String.valueOf(it.get("year"))); } catch (Exception ignore) {}
                }

                Course newIt = new Course();
                newIt.setSemester(semester);
                newIt.setTermTitle(termTitle == null || termTitle.isBlank() ? semester : termTitle);
                newIt.setSubjectCode(it.get("subjectCode") == null ? null : String.valueOf(it.get("subjectCode")));
                newIt.setPrerequisite(it.get("prerequisite") == null ? null : String.valueOf(it.get("prerequisite")));
                newIt.setEquivSubjectCode(it.get("equivSubjectCode") == null ? null : String.valueOf(it.get("equivSubjectCode")));
                newIt.setDescription(it.get("description") == null ? null : String.valueOf(it.get("description")));
                try { newIt.setUnits(it.get("units") == null ? null : Integer.valueOf(String.valueOf(it.get("units")))); } catch (Exception ignore) {}
                newIt.setYear(year);
                newIt.setProgram(savedProgram);
                newIt.setCurriculum(version);
                toSave.add(newIt);
            }
            if (!toSave.isEmpty()) {
                courseRepository.saveAll(toSave);
            }
        }

        return ResponseEntity.ok(savedProgram);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
                                    @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        if (!curriculumRepository.existsById(id)) return ResponseEntity.notFound().build();
        curriculumRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<?> cloneCurriculum(@PathVariable Long id,
                                             @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (!isAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        // Interpret {id} as a Program id to clone the program and its curriculum items
        Optional<Program> srcProg = programRepository.findById(id);
        if (srcProg.isEmpty()) return ResponseEntity.notFound().build();
        Program src = srcProg.get();

        Program p = new Program();
        String baseName = src.getName();
        p.setName(baseName == null ? "Cloned Program" : baseName + " (Copy)");
        p.setDepartment(src.getDepartment());
        p.setDurationInYears(src.getDurationInYears());

        var items = courseRepository.findAllByProgram_Id(src.getId());
        Curriculum newVersion = new Curriculum();
        newVersion.setProgram(p);
        newVersion.setVersionName((baseName == null ? "Cloned" : baseName) + " - Clone");
        newVersion.setEffectivityYear(java.time.LocalDate.now().getYear());
        newVersion.setDurationInYears(p.getDurationInYears());
        newVersion = curriculumRepository.save(newVersion);

        if (items != null) {
            java.util.List<Course> toSave = new java.util.ArrayList<>();
            for (var it : items) {
                Course newIt = new Course();
                newIt.setSemester(it.getSemester());
                newIt.setSubjectCode(it.getSubjectCode());
                newIt.setPrerequisite(it.getPrerequisite());
                newIt.setEquivSubjectCode(it.getEquivSubjectCode());
                newIt.setDescription(it.getDescription());
                newIt.setUnits(it.getUnits());
                newIt.setProgram(p);
                newIt.setCurriculum(newVersion);
                toSave.add(newIt);
            }
            if (!toSave.isEmpty()) courseRepository.saveAll(toSave);
        }

        Program saved = programRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/byProgramId/{programId}")
    public ResponseEntity<?> getByProgramId(@PathVariable Long programId) {
        Optional<Program> prog = programRepository.findById(programId);
        if (prog.isEmpty()) return ResponseEntity.notFound().build();
        Program p = prog.get();
        var items = courseRepository.findAllByProgram_Id(p.getId());
        var dtoItems = items.stream()
            .sorted(Comparator
                .comparing((Course c) -> yearOrder(c.getYear()))
                .thenComparing(c -> termOrder(resolveTermLabel(c)))
                .thenComparing(Course::getId, Comparator.nullsLast(Long::compareTo)))
            .map(this::courseToDto)
            .toList();
        java.util.Map<String,Object> out = new java.util.HashMap<>();
        out.put("program", java.util.Map.of("id", p.getId(), "name", p.getName(), "durationInYears", p.getDurationInYears()));
        out.put("department", p.getDepartment() == null ? null : java.util.Map.of("id", p.getDepartment().getId(), "name", p.getDepartment().getName()));
        out.put("programId", p.getId());
        out.put("programName", p.getName());
        out.put("programCode", p.getName());
        out.put("durationInYears", p.getDurationInYears());
        if (p.getDepartment() != null) {
            out.put("departmentId", p.getDepartment().getId());
        }
        var versions = curriculumRepository.findAllByProgram_Id(p.getId());
        Curriculum version = versions.isEmpty() ? null : versions.get(0);
        if (version != null) {
            out.put("curriculumId", version.getId());
            if (version.getVersionName() != null) out.put("curriculumVersionName", version.getVersionName());
            if (version.getEffectivityYear() != null) out.put("effectivityYear", version.getEffectivityYear());
            if (version.getDurationInYears() != null && out.get("durationInYears") == null) {
                out.put("durationInYears", version.getDurationInYears());
            }
        }
        out.put("items", dtoItems);
        return ResponseEntity.ok(out);
    }

	private boolean isAdmin(ClasslinkUserDetails principal) {
		return principal != null && "ADMIN".equalsIgnoreCase(principal.getRole());
	}
}

package com.classlink.server.controller;

import com.classlink.server.model.Curriculum;
import com.classlink.server.repository.CurriculumRepository;
import com.classlink.server.repository.ProgramRepository;
import com.classlink.server.repository.DepartmentRepository;
import com.classlink.server.model.Department;
import com.classlink.server.model.Program;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/curricula")
public class CurriculumController {

    private final CurriculumRepository curriculumRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;

    public CurriculumController(CurriculumRepository curriculumRepository, ProgramRepository programRepository, DepartmentRepository departmentRepository) {
        this.curriculumRepository = curriculumRepository;
        this.programRepository = programRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            var all = curriculumRepository.findAll();
            // return lightweight metadata to avoid serialization issues
            var out = all.stream().map(c -> {
                java.util.Map<String,Object> m = new java.util.HashMap<>();
                m.put("curriculumId", c.getCurriculumId());
                m.put("programCode", c.getProgramCode());
                m.put("programName", c.getProgramName());
                m.put("itemsCount", c.getItems() == null ? 0 : c.getItems().size());
                if (c.getDepartment() != null) {
                    java.util.Map<String,Object> d = new java.util.HashMap<>();
                    d.put("id", c.getDepartment().getId());
                    d.put("name", c.getDepartment().getName());
                    m.put("department", d);
                }
                return m;
            }).toList();
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            System.err.println("Error listing curricula: " + ex.getMessage());
            return ResponseEntity.status(500).body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{programCode}")
    public ResponseEntity<?> getByProgram(@PathVariable String programCode) {
        // Prefer Program-based curricula (new model). Try exact program name first.
        String normalized = programCode.trim();
        // Try to find a Program whose name exactly matches the incoming value
        java.util.Optional<Program> maybeProg = programRepository.findAll().stream()
                .filter(p -> p.getName() != null && (p.getName().equalsIgnoreCase(normalized) || (p.getName().trim()).equalsIgnoreCase(normalized)))
                .findFirst();

        if (maybeProg.isPresent()) {
            Program prog = maybeProg.get();
            return ResponseEntity.ok(prog);
        }

        // Fallback to legacy Curriculum lookup by code or name
        Optional<Curriculum> cur = curriculumRepository.findByProgramCode(programCode);
        if (cur.isPresent()) {
            Long id = cur.get().getCurriculumId();
            Optional<Curriculum> withItems = curriculumRepository.findById(id);
            if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
            return ResponseEntity.ok(cur.get());
        }

        cur = curriculumRepository.findByProgramName(programCode);
        if (cur.isPresent()) {
            Long id = cur.get().getCurriculumId();
            Optional<Curriculum> withItems = curriculumRepository.findById(id);
            if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
            return ResponseEntity.ok(cur.get());
        }

        // Try formatted match like "CODE - Program Name" and other heuristics (legacy behavior)
        Optional<Curriculum> found = curriculumRepository.findAll().stream()
                .filter(c -> (c.getProgramName() != null && c.getProgramName().toLowerCase().contains(normalized.toLowerCase()))
                        || (c.getProgramCode() != null && c.getProgramCode().equalsIgnoreCase(normalized)))
                .findFirst();

        return found.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Curriculum c) {
        // Resolve department if provided
        Department d = null;
        if (c.getDepartment() != null && c.getDepartment().getId() != null) {
            try {
                Long did = Long.valueOf(String.valueOf(c.getDepartment().getId()));
                d = departmentRepository.findById(did).orElse(null);
            } catch (Exception ex) {
                d = null;
            }
        }

        // Persist curriculum as part of Program (collapse Curriculum -> Program)
        Program program = null;
        if (c.getProgramName() != null && !c.getProgramName().isBlank()) {
            program = programRepository.findByName(c.getProgramName()).orElse(null);
        }
        if (program == null) {
            program = new Program();
        }
        // prefer programName; fall back to programCode
        if (c.getProgramName() != null && !c.getProgramName().isBlank()) program.setName(c.getProgramName());
        else if (c.getProgramCode() != null && !c.getProgramCode().isBlank()) program.setName(c.getProgramCode());

        if (c.getDurationInYears() != null) program.setDurationInYears(c.getDurationInYears());
        if (d != null) program.setDepartment(d);

        // Replace curriculum items on the Program
        program.getCurriculum().clear();
        if (c.getItems() != null) {
            for (var it : c.getItems()) {
                if (it.getYearLabel() == null || it.getYearLabel().isBlank()) it.setYearLabel("First Year");
                if ((it.getSemester() == null || it.getSemester().isBlank()) && (it.getTermTitle() != null)) {
                    it.setSemester(it.getTermTitle());
                }
                com.classlink.server.model.CurriculumItem newIt = new com.classlink.server.model.CurriculumItem();
                newIt.setYearLabel(it.getYearLabel());
                newIt.setSemester(it.getSemester());
                newIt.setSubjectCode(it.getSubjectCode());
                newIt.setPrerequisite(it.getPrerequisite());
                newIt.setEquivSubjectCode(it.getEquivSubjectCode());
                newIt.setDescription(it.getDescription());
                newIt.setUnits(it.getUnits());
                newIt.setProgram(program);
                program.getCurriculum().add(newIt);
            }
        }

        Program saved = programRepository.save(program);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Curriculum c) {
        // For updates, map the incoming Curriculum DTO into Program and upsert program by name.
        String desiredName = c.getProgramName() != null && !c.getProgramName().isBlank() ? c.getProgramName() : c.getProgramCode();
        if (desiredName == null || desiredName.isBlank()) return ResponseEntity.badRequest().body(java.util.Map.of("error", "programName or programCode required"));

        Program program = programRepository.findByName(desiredName).orElseGet(() -> new Program());
        program.setName(desiredName);
        if (c.getDurationInYears() != null) program.setDurationInYears(c.getDurationInYears());
        if (c.getDepartment() != null && c.getDepartment().getId() != null) {
            Long did = c.getDepartment().getId();
            Department d = departmentRepository.findById(did).orElse(null);
            program.setDepartment(d);
        }

        // Replace curriculum items
        program.getCurriculum().clear();
        if (c.getItems() != null) {
            for (var it : c.getItems()) {
                if (it.getYearLabel() == null || it.getYearLabel().isBlank()) it.setYearLabel("First Year");
                if ((it.getSemester() == null || it.getSemester().isBlank()) && (it.getTermTitle() != null)) {
                    it.setSemester(it.getTermTitle());
                }
                com.classlink.server.model.CurriculumItem newIt = new com.classlink.server.model.CurriculumItem();
                newIt.setYearLabel(it.getYearLabel());
                newIt.setSemester(it.getSemester());
                newIt.setSubjectCode(it.getSubjectCode());
                newIt.setPrerequisite(it.getPrerequisite());
                newIt.setEquivSubjectCode(it.getEquivSubjectCode());
                newIt.setDescription(it.getDescription());
                newIt.setUnits(it.getUnits());
                newIt.setProgram(program);
                program.getCurriculum().add(newIt);
            }
        }

        Program saved = programRepository.save(program);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!curriculumRepository.existsById(id)) return ResponseEntity.notFound().build();
        curriculumRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<?> cloneCurriculum(@PathVariable Long id) {
        Optional<Curriculum> existing = curriculumRepository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        Curriculum src = existing.get();

        // Clone legacy Curriculum into a new Program with curriculum items
        Program p = new Program();
        String baseName = src.getProgramName() != null && !src.getProgramName().isBlank() ? src.getProgramName() : src.getProgramCode();
        p.setName(baseName == null ? "Cloned Program" : baseName + " (Copy)");
        p.setDepartment(src.getDepartment());

        if (src.getItems() != null) {
            for (var it : src.getItems()) {
                com.classlink.server.model.CurriculumItem newIt = new com.classlink.server.model.CurriculumItem();
                newIt.setYearLabel(it.getYearLabel());
                newIt.setSemester(it.getSemester());
                newIt.setSubjectCode(it.getSubjectCode());
                newIt.setPrerequisite(it.getPrerequisite());
                newIt.setEquivSubjectCode(it.getEquivSubjectCode());
                newIt.setDescription(it.getDescription());
                newIt.setUnits(it.getUnits());
                newIt.setProgram(p);
                p.getCurriculum().add(newIt);
            }
        }

        Program saved = programRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/byProgramId/{programId}")
    public ResponseEntity<?> getByProgramId(@PathVariable Long programId) {
        System.out.println("[DEBUG][CurriculumController] getByProgramId called with programId=" + programId);
        Optional<Program> prog = programRepository.findById(programId);
        if (prog.isEmpty()) return ResponseEntity.notFound().build();
        String name = prog.get().getName() != null ? prog.get().getName().trim() : "";
        System.out.println("[DEBUG][CurriculumController] program.name='" + name + "'");

        // try exact code/name first
        Optional<Curriculum> cur = curriculumRepository.findByProgramCode(name);
        if (cur.isPresent()) {
            Long id = cur.get().getCurriculumId();
            Optional<Curriculum> withItems = curriculumRepository.findById(id);
            if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
            return ResponseEntity.ok(cur.get());
        }
        cur = curriculumRepository.findByProgramName(name);
        if (cur.isPresent()) {
            Long id = cur.get().getCurriculumId();
            Optional<Curriculum> withItems = curriculumRepository.findById(id);
            if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
            return ResponseEntity.ok(cur.get());
        }

        // if the program name contains a code prefix like "CODE - Program Name", try splitting
        if (name.contains(" - ")) {
            String[] parts = name.split(" - ", 2);
            String maybeCode = parts[0].trim();
            String maybeProgramName = parts.length > 1 ? parts[1].trim() : "";
            // try code
            cur = curriculumRepository.findByProgramCode(maybeCode);
            if (cur.isPresent()) {
                Long id = cur.get().getCurriculumId();
                Optional<Curriculum> withItems = curriculumRepository.findById(id);
                if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
                return ResponseEntity.ok(cur.get());
            }
            // try program name portion
            cur = curriculumRepository.findByProgramName(maybeProgramName);
            if (cur.isPresent()) {
                Long id = cur.get().getCurriculumId();
                Optional<Curriculum> withItems = curriculumRepository.findById(id);
                if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
                return ResponseEntity.ok(cur.get());
            }
        }

        // try contains match on programName (case-insensitive) or match by code equality
        String lower = name.toLowerCase();
        // DEBUG: list all curricula metadata for troubleshooting
        try {
            var all = curriculumRepository.findAll();
            System.out.println("[DEBUG][CurriculumController] curricula in DB (count=" + (all == null ? 0 : all.size()) + ")");
            if (all != null) {
                all.forEach(c -> System.out.println("[DEBUG][CurriculumController] curriculum: code='" + c.getProgramCode() + "' name='" + c.getProgramName() + "' id=" + c.getCurriculumId()));
            }
        } catch (Exception ex) {
            System.out.println("[DEBUG][CurriculumController] failed to list curricula: " + ex.getMessage());
        }

        Optional<Curriculum> found = curriculumRepository.findAll().stream()
                .filter(c -> (c.getProgramName() != null && c.getProgramName().toLowerCase().contains(lower))
                        || (c.getProgramCode() != null && c.getProgramCode().equalsIgnoreCase(name)))
                .findFirst();

        if (found.isEmpty()) {
            System.out.println("[DEBUG][CurriculumController] no curriculum matched for program name='" + name + "' (lower='" + lower + "')");
            // fallback: try to build an acronym/code from the program name (e.g., "Bachelor of Science in Information Technology" -> "BSIT")
            if (!name.isBlank()) {
                String[] parts = name.split("[^A-Za-z0-9]+");
                java.util.List<String> words = new java.util.ArrayList<>();
                for (String w : parts) {
                    if (w == null || w.isBlank()) continue;
                    String lw = w.toLowerCase();
                    if (lw.equals("of") || lw.equals("in") || lw.equals("and") || lw.equals("the") || lw.equals("for") || lw.equals("&")) continue;
                    words.add(w);
                }
                StringBuilder code = new StringBuilder();
                // Build acronym by taking uppercase letters first, otherwise first letters of each significant word
                String upperLetters = "";
                for (char ch : name.toCharArray()) {
                    if (Character.isUpperCase(ch) && Character.isLetter(ch)) upperLetters += ch;
                }
                if (!upperLetters.isBlank()) {
                    code.append(upperLetters);
                } else {
                    for (String w : words) {
                        code.append(Character.toUpperCase(w.charAt(0)));
                    }
                }
                String acronym = code.toString();
                if (acronym.length() >= 2) {
                    System.out.println("[DEBUG][CurriculumController] trying acronym fallback='" + acronym + "'");
                    Optional<Curriculum> byCode = curriculumRepository.findByProgramCode(acronym);
                    if (byCode.isPresent()) {
                        System.out.println("[DEBUG][CurriculumController] matched curriculum by acronym code='" + acronym + "' id=" + byCode.get().getCurriculumId());
                        Long id = byCode.get().getCurriculumId();
                        Optional<Curriculum> withItems = curriculumRepository.findById(id);
                        if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
                        return ResponseEntity.ok(byCode.get());
                    }
                }
            }
        } else {
            System.out.println("[DEBUG][CurriculumController] matched curriculum id=" + found.get().getCurriculumId());
        }

        if (found.isPresent()) {
            Long id = found.get().getCurriculumId();
            Optional<Curriculum> withItems = curriculumRepository.findById(id);
            if (withItems.isPresent()) return ResponseEntity.ok(withItems.get());
            return ResponseEntity.ok(found.get());
        }

        return ResponseEntity.notFound().build();
    }
}

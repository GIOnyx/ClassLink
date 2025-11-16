package com.classlink.server.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.classlink.server.model.Department;
import com.classlink.server.model.Program;
import com.classlink.server.repository.DepartmentRepository;
import com.classlink.server.repository.ProgramRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class DataLoader implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final ProgramRepository programRepository;

    public DataLoader(DepartmentRepository departmentRepository, ProgramRepository programRepository) {
        this.departmentRepository = departmentRepository;
        this.programRepository = programRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Build departments and programs based on the list provided by the user
        List<Department> deps = new ArrayList<>();

        Department engArch = new Department();
        engArch.setName("College of Engineering and Architecture");
        deps.add(engArch);

        Department mgmt = new Department();
        mgmt.setName("College of Management, Business & Accountancy");
        deps.add(mgmt);

        Department ccs = new Department();
        ccs.setName("College of Computer Studies");
        deps.add(ccs);

        Department arts = new Department();
        arts.setName("College of Arts, Sciences & Education");
        deps.add(arts);

        Department nursing = new Department();
        nursing.setName("College of Nursing & Allied Health Sciences");
        deps.add(nursing);

        Department crim = new Department();
        crim.setName("College of Criminal Justice");
        deps.add(crim);

        // Save departments if they don't already exist; otherwise load persisted ones
        if (departmentRepository.count() == 0) {
            departmentRepository.saveAll(deps);
        }

        // Ensure we reference persisted Department entities (important when DB already has departments)
        Map<String, Department> persistedByName = departmentRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Department::getName, d -> d));

        engArch = persistedByName.getOrDefault(engArch.getName(), engArch);
        mgmt = persistedByName.getOrDefault(mgmt.getName(), mgmt);
        ccs = persistedByName.getOrDefault(ccs.getName(), ccs);
        arts = persistedByName.getOrDefault(arts.getName(), arts);
        nursing = persistedByName.getOrDefault(nursing.getName(), nursing);
        crim = persistedByName.getOrDefault(crim.getName(), crim);

        // Programs for Engineering & Architecture (note: Computer Engineering moved to CCS as requested)
        List<Program> programs = new ArrayList<>();
        programs.add(program("BS Architecture", engArch));
        programs.add(program("BS Chemical Engineering", engArch));
        programs.add(program("BS Civil Engineering", engArch));
        programs.add(program("BS Electrical Engineering", engArch));
        programs.add(program("BS Electronics Engineering", engArch));
        programs.add(program("BS Industrial Engineering", engArch));
        programs.add(program("BS Mechanical Engineering", engArch));
        programs.add(program("BS Mining Engineering", engArch));

        // Management programs
        programs.add(program("BS Accountancy", mgmt));
        programs.add(program("BS Accounting Information Systems", mgmt));
        programs.add(program("BS Management Accounting", mgmt));
        programs.add(program("BS Business Administration - Banking & Financial Management", mgmt));
        programs.add(program("BS Business Administration - Business Analytics", mgmt));
        programs.add(program("BS Business Administration - General Business Management", mgmt));
        programs.add(program("BS Business Administration - Human Resource Management", mgmt));
        programs.add(program("BS Business Administration - Marketing Management", mgmt));
        programs.add(program("BS Business Administration - Operations Management", mgmt));
        programs.add(program("BS Business Administration - Quality Management", mgmt));
        programs.add(program("BS Hospitality Management", mgmt));

        // College of Computer Studies
        programs.add(program("BS Computer Science", ccs));
        programs.add(program("BS Information Technology", ccs));
        programs.add(program("BS Information Systems", ccs));
        programs.add(program("BS Computer Engineering", ccs));

        // Arts, Sciences & Education
        programs.add(program("BS Psychology", arts));
        programs.add(program("BS Biology", arts));
        programs.add(program("BS English with Applied Linguistics", arts));
        programs.add(program("Bachelor of Secondary Education", arts));
        programs.add(program("Bachelor of Elementary Education", arts));

        // Nursing & Allied Health
        programs.add(program("BS Nursing", nursing));
        programs.add(program("BS Pharmacy", nursing));
        programs.add(program("BS Medical Technology", nursing));

        // Criminal Justice
        programs.add(program("BS Criminology", crim));

        // For each desired program, update existing entry's duration (and department) or create it.
        List<Program> toSave = new ArrayList<>();
        for (Program desired : programs) {
            programRepository.findByName(desired.getName()).ifPresentOrElse(existing -> {
                existing.setDurationInYears(desired.getDurationInYears());
                existing.setDepartment(desired.getDepartment());
                toSave.add(existing);
            }, () -> {
                toSave.add(desired);
            });
        }

        programRepository.saveAll(toSave);
    }

    private Program program(String name, Department d) {
        Program p = new Program();
        p.setName(name);
        p.setDepartment(d);
        p.setDurationInYears(durationFor(name));
        return p;
    }

    private int durationFor(String name) {
        // Map program names to durations based on user-provided data.
        // Default to 4 years if not explicitly listed.
        switch (name) {
            case "BS Architecture":
                return 5;
            case "BS Chemical Engineering":
                return 5;
            case "BS Civil Engineering":
                // range 4-5 years; choose 5 to reflect upper bound
                return 5;
            case "BS Computer Engineering":
                return 4;
            case "BS Electrical Engineering":
                return 4;
            case "BS Electronics Engineering":
                return 4;
            case "BS Industrial Engineering":
                return 4;
            case "BS Mechanical Engineering":
            case "BS Mechanical Engineering (with Mechatronics or Computational Science)":
                return 4;
            case "BS Mining Engineering":
                return 5;
            case "BS Accountancy":
                return 5;
            case "BS Accounting Information Systems":
                return 4;
            case "BS Management Accounting":
                return 4;
            case "BS Business Administration - Banking & Financial Management":
            case "BS Business Administration - Business Analytics":
            case "BS Business Administration - General Business Management":
            case "BS Business Administration - Human Resource Management":
            case "BS Business Administration - Marketing Management":
            case "BS Business Administration - Operations Management":
            case "BS Business Administration - Quality Management":
                return 4;
            case "BS Hospitality Management":
                return 4;
            case "BS Computer Science":
            case "BS Information Technology":
            case "BS Information Systems":
                return 4;
            case "BS Psychology":
            case "BS Biology":
            case "BS English with Applied Linguistics":
            case "Bachelor of Secondary Education":
            case "Bachelor of Elementary Education":
                return 4;
            case "BS Nursing":
            case "BS Pharmacy":
            case "BS Medical Technology":
                return 4;
            case "BS Criminology":
                return 4;
            default:
                return 4;
        }
    }
}

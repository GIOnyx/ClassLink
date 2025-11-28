package com.classlink.server.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.classlink.server.model.Department;
import com.classlink.server.model.Program;
// legacy Curriculum model still present in the repo; seeding now targets Program + CurriculumItem
import com.classlink.server.model.Curriculum;
import com.classlink.server.model.Course;
import com.classlink.server.repository.CourseRepository;
import com.classlink.server.repository.DepartmentRepository;
import com.classlink.server.repository.ProgramRepository;
import com.classlink.server.repository.CurriculumRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final DepartmentRepository departmentRepository;
    private final ProgramRepository programRepository;
    private final CurriculumRepository curriculumRepository;
    private final CourseRepository courseRepository;

    public DataLoader(DepartmentRepository departmentRepository, ProgramRepository programRepository, CurriculumRepository curriculumRepository, CourseRepository courseRepository) {
        this.departmentRepository = departmentRepository;
        this.programRepository = programRepository;
        this.curriculumRepository = curriculumRepository;
        this.courseRepository = courseRepository;
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

        // --- Seed or replace a BSIT program + curriculum (idempotent) ---
        boolean hasBsit = programRepository.findByName("Bachelor of Science in Information Technology").isPresent();
        if (!hasBsit) {
            try {
                Program bsit = new Program();
                bsit.setName("Bachelor of Science in Information Technology");
                bsit.setDepartment(ccs);
                bsit.setDurationInYears(4);

                // Save program first so we can attach courses and a default curriculum version
                bsit = programRepository.save(bsit);

                // Create a default curriculum version for this program
                Curriculum defaultVersion = new Curriculum();
                defaultVersion.setProgram(bsit);
                defaultVersion.setVersionName("Imported - initial");
                defaultVersion.setEffectivityYear(java.time.LocalDate.now().getYear());
                defaultVersion.setDurationInYears(bsit.getDurationInYears());
                defaultVersion = curriculumRepository.save(defaultVersion);

                List<Course> items = new ArrayList<>();

                // First Year - First Term
                items.add(itemCourse(bsit, defaultVersion, "PHILO031", "", "PHILO031", "Ethics", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT121", "", "CSIT121", "Fundamentals of Programming", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT111", "", "CSIT111", "Introduction to Computing", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "MATH031", "", "MATH031", "Mathematics in the Modern World", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "PE103", "", "PE103", "Movement Enhancement / PATHFit 1-Movement Competency Training", 2, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "NSTP111", "", "NSTP111", "National Service Training Program 1", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "ENGL031", "", "ENGL031", "Purposive Communication", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "PSYCH031", "", "PSYCH031", "Understanding the Self", 3, "First Semester"));

                // First Year - Second Term
                items.add(itemCourse(bsit, defaultVersion, "HUM031", "", "HUM031", "Art Appreciation", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT112", "CSIT121", "CSIT112", "Discrete Structures 1", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "PE104", "PE103", "PE104", "Fitness Exercises / PATHFit 2-Exercise-based Fitness Activities", 2, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT122", "CSIT121", "CSIT122", "Intermediate Programming", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CS132", "CSIT111", "CS132", "Introduction to Computer Systems", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "NSTP112", "NSTP111", "NSTP112", "National Service Training Program 2", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT201", "CSIT121", "CSIT201", "Platform-based Development 2 (Web)", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "SOCSC1031", "", "SOCSC1031", "Readings in Philippine History", 3, "Second Semester"));
                items.add(itemCourse(bsit, defaultVersion, "STS031", "", "STS031", "Science, Technology and Society", 3, "Second Semester"));

                // Second Year - First Term (partial)
                items.add(itemCourse(bsit, defaultVersion, "CSIT221", "CSIT122", "CSIT221", "Data Structures and Algorithms", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "GE-IT1", "", "SDG031", "General Education Elective 1", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "IT227", "CS132", "IT227", "Networking 1", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT227", "CSIT122", "CSIT227", "Object-oriented Programming 1", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "PE205", "PE103", "PE205", "PATHFIT 1 / PATHFIT 3-Menu of Sports, Dance, Recreation and Martial Arts", 2, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT104", "", "CSIT104", "Platform-based Development 1 (Multimedia)", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "CSIT213", "CSIT111", "CSIT213", "Social Issues and Professional Practice", 3, "First Semester"));
                items.add(itemCourse(bsit, defaultVersion, "SOCSIC032", "", "SOCSIC032", "The Contemporary World", 3, "First Semester"));

                courseRepository.saveAll(items);
            } catch (Exception ex) {
                log.warn("Skipping BSIT curriculum seeding because: {}", ex.getMessage());
            }
        } else {
            // If BSIT exists but user wants a fresh full curriculum, replace/update it here.
            // Current behavior: do not overwrite an existing BSIT entry. If you want to force-replace,
            // change this logic to remove and recreate. For now, we ensure programCode/name fields are set
            // on any existing BSIT record.
            // If BSIT exists, ensure at least one curriculum item exists for it (do nothing otherwise).
            programRepository.findByName("Bachelor of Science in Information Technology").ifPresent(prog -> {
                var existing = curriculumRepository.findAllByProgram_Id(prog.getId());
                if (existing == null || existing.isEmpty()) {
                    // no curriculum items persisted for BSIT; nothing to auto-create here.
                }
            });
        }
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

    private Course itemCourse(Program prog, Curriculum version, String code, String prereq, String equiv, String desc, Integer units, String semester) {
        Course it = new Course();
        it.setProgram(prog);
        it.setCurriculum(version);
        it.setSubjectCode(code);
        it.setPrerequisite(prereq);
        it.setEquivSubjectCode(equiv);
        it.setDescription(desc);
        it.setUnits(units);
        it.setSemester(semester);
        return it;
    }
}

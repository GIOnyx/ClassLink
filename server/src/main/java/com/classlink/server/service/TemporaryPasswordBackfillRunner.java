package com.classlink.server.service;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.StudentRepository;

@Component
public class TemporaryPasswordBackfillRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(TemporaryPasswordBackfillRunner.class);

    private final StudentRepository studentRepository;
    private final TemporaryPasswordService temporaryPasswordService;

    public TemporaryPasswordBackfillRunner(StudentRepository studentRepository,
            TemporaryPasswordService temporaryPasswordService) {
        this.studentRepository = studentRepository;
        this.temporaryPasswordService = temporaryPasswordService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Student> needsUpdate = studentRepository.findAllWithMissingTempPassword(StudentStatus.APPROVED);
        if (needsUpdate.isEmpty()) {
            return;
        }
        for (Student student : needsUpdate) {
            String generated = temporaryPasswordService.generate();
            student.setTempPassword(generated);
            student.setTempPasswordActive(true);
            if (student.getPassword() == null || student.getPassword().isBlank()) {
                student.setPassword(generated);
            }
        }
        studentRepository.saveAll(needsUpdate);
        log.info("Backfilled temporary passwords for {} approved students", needsUpdate.size());
    }
}

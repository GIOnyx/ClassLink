package com.classlink.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.classlink.server.model.Program;
import java.util.List;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    List<Program> findAllByDepartmentId(Long departmentId);
    java.util.Optional<Program> findByName(String name);
}

package com.classlink.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.classlink.server.model.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}

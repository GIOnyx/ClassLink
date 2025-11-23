package com.classlink.server.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.classlink.server.model.Course;

public interface CourseRepository extends JpaRepository<Course, Integer> {
    List<Course> findByProgramId(Long programId);
}
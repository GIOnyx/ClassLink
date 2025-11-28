package com.classlink.server.repository;

import com.classlink.server.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByProgram_Id(Long programId);
}


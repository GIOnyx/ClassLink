package com.classlink.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.Curriculum;

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
	List<Curriculum> findAllByProgram_Id(Long programId);
}

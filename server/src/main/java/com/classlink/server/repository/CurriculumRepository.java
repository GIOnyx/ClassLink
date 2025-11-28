package com.classlink.server.repository;

import com.classlink.server.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
	// Legacy finders removed: use ProgramRepository + findAllByProgram_Id instead.
	List<Curriculum> findAllByProgram_Id(Long programId);
}

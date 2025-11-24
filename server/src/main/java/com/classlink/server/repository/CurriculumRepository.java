package com.classlink.server.repository;

import com.classlink.server.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
	Optional<Curriculum> findByProgramCode(String programCode);
	Optional<Curriculum> findByProgramName(String programName);
}

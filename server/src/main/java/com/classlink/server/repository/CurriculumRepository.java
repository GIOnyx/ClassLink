package com.classlink.server.repository;

import com.classlink.server.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
// legacy helper removed: findByIdWithItems no longer applicable because items moved to Program

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
	Optional<Curriculum> findByProgramCode(String programCode);
	Optional<Curriculum> findByProgramName(String programName);

	// Note: legacy fetch-by-id-with-items was removed; use default findById(id) instead.
}

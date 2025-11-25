package com.classlink.server.repository;

import com.classlink.server.model.CurriculumItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CurriculumItemRepository extends JpaRepository<CurriculumItem, Long> {
    // Items are now associated with Program (program_id). Provide helper to find by program id.
    List<CurriculumItem> findAllByProgram_Id(Long programId);
}

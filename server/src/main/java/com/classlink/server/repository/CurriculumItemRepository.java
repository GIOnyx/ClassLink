package com.classlink.server.repository;

import com.classlink.server.model.CurriculumItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CurriculumItemRepository extends JpaRepository<CurriculumItem, Long> {
    List<CurriculumItem> findAllByCurriculum_CurriculumId(Long curriculumId);
}

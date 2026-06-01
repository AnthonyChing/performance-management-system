package com.pms.repository;

import com.pms.entity.TemplateQuestion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateQuestionRepository extends JpaRepository<TemplateQuestion, UUID> {

    List<TemplateQuestion> findByTemplateIdAndDeletedAtIsNullOrderBySortOrderAsc(UUID templateId);

    List<TemplateQuestion> findByIdInAndDeletedAtIsNull(List<UUID> ids);

    Optional<TemplateQuestion> findByIdAndTemplateIdAndDeletedAtIsNull(UUID id, UUID templateId);

    long countByTemplateIdAndDeletedAtIsNull(UUID templateId);
}

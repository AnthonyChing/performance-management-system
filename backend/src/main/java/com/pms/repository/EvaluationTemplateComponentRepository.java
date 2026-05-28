package com.pms.repository;

import com.pms.entity.EvaluationTemplateComponent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationTemplateComponentRepository
        extends JpaRepository<EvaluationTemplateComponent, UUID> {

    List<EvaluationTemplateComponent> findByEvaluationTemplateIdOrderBySortOrder(
            UUID evaluationTemplateId);

    void deleteAllByEvaluationTemplateId(UUID evaluationTemplateId);
}

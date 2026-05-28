package com.pms.repository;

import com.pms.entity.AssessmentTemplate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentTemplateRepository extends JpaRepository<AssessmentTemplate, UUID> {

    Optional<AssessmentTemplate> findByIdAndDeletedAtIsNull(UUID id);

    @Query(
            value =
                    """
            SELECT * FROM assessment_templates
            WHERE deleted_at IS NULL
              AND (:status IS NULL OR status::text = :status)
              AND (:jobCategory IS NULL OR job_category = :jobCategory)
            ORDER BY created_at DESC
            """,
            countQuery =
                    """
            SELECT count(*) FROM assessment_templates
            WHERE deleted_at IS NULL
              AND (:status IS NULL OR status::text = :status)
              AND (:jobCategory IS NULL OR job_category = :jobCategory)
            """,
            nativeQuery = true)
    Page<AssessmentTemplate> findAllFiltered(
            @Param("status") String status,
            @Param("jobCategory") String jobCategory,
            Pageable pageable);

    @Query(
            value =
                    """
            SELECT count(*) FROM cycle_template_assignments WHERE template_id = :templateId
            """,
            nativeQuery = true)
    long countCycleUsages(@Param("templateId") UUID templateId);
}

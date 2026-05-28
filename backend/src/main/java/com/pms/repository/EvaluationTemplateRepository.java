package com.pms.repository;

import com.pms.entity.EvaluationTemplate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EvaluationTemplateRepository extends JpaRepository<EvaluationTemplate, UUID> {

    Optional<EvaluationTemplate> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCycleIdAndEmployeeGroupTypeAndEmployeeGroupRefAndDeletedAtIsNullAndArchivedAtIsNull(
            UUID cycleId, String employeeGroupType, String employeeGroupRef);

    @Query(
            value =
                    """
            SELECT * FROM evaluation_templates
            WHERE deleted_at IS NULL
              AND (:status IS NULL OR status::text = :status)
              AND (:cycleId IS NULL OR cycle_id = CAST(:cycleId AS uuid))
              AND (:q IS NULL OR name ILIKE '%' || :q || '%')
            ORDER BY created_at DESC
            """,
            countQuery =
                    """
            SELECT count(*) FROM evaluation_templates
            WHERE deleted_at IS NULL
              AND (:status IS NULL OR status::text = :status)
              AND (:cycleId IS NULL OR cycle_id = CAST(:cycleId AS uuid))
              AND (:q IS NULL OR name ILIKE '%' || :q || '%')
            """,
            nativeQuery = true)
    Page<EvaluationTemplate> findAllFiltered(
            @Param("status") String status,
            @Param("cycleId") String cycleId,
            @Param("q") String q,
            Pageable pageable);
}

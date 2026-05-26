package com.pms.repository;

import com.pms.entity.KpiEvaluation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KpiEvaluationRepository extends JpaRepository<KpiEvaluation, UUID> {

    List<KpiEvaluation> findByReviewId(UUID reviewId);

    Optional<KpiEvaluation> findByReviewIdAndKpiId(UUID reviewId, UUID kpiId);
}

package com.pms.repository;

import com.pms.entity.PerformanceReview;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {

    Optional<PerformanceReview> findByCycleIdAndEmployeeId(UUID cycleId, UUID employeeId);

    List<PerformanceReview> findByEmployeeId(UUID employeeId);

    @Query(
            value =
                    """
            SELECT pr.* FROM performance_reviews pr
            WHERE (CAST(:cycleId AS text) IS NULL OR pr.cycle_id = CAST(:cycleId AS uuid))
              AND (CAST(:employeeId AS text) IS NULL OR pr.employee_id = CAST(:employeeId AS uuid))
              AND (CAST(:reviewStatus AS text) IS NULL OR pr.status::text = :reviewStatus)
            ORDER BY pr.created_at DESC
            """,
            countQuery =
                    """
            SELECT count(*) FROM performance_reviews pr
            WHERE (CAST(:cycleId AS text) IS NULL OR pr.cycle_id = CAST(:cycleId AS uuid))
              AND (CAST(:employeeId AS text) IS NULL OR pr.employee_id = CAST(:employeeId AS uuid))
              AND (CAST(:reviewStatus AS text) IS NULL OR pr.status::text = :reviewStatus)
            """,
            nativeQuery = true)
    Page<PerformanceReview> findFiltered(
            @Param("cycleId") String cycleId,
            @Param("employeeId") String employeeId,
            @Param("reviewStatus") String reviewStatus,
            Pageable pageable);
}

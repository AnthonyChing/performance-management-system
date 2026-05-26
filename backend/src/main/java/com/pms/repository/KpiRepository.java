package com.pms.repository;

import com.pms.entity.Kpi;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface KpiRepository extends JpaRepository<Kpi, UUID> {

    List<Kpi> findByCycleIdAndDeletedAtIsNull(UUID cycleId);

    @Query(
            value =
                    """
            SELECT k.* FROM kpis k
            JOIN kpi_assignments ka ON ka.kpi_id = k.id
            WHERE ka.user_id = :userId
              AND k.deleted_at IS NULL
              AND (:cycleId IS NULL OR k.cycle_id = CAST(:cycleId AS uuid))
            ORDER BY k.created_at DESC
            """,
            nativeQuery = true)
    List<Kpi> findByUserIdAndOptionalCycle(
            @Param("userId") UUID userId, @Param("cycleId") String cycleId);
}

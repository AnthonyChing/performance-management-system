package com.pms.repository;

import com.pms.entity.KpiProgressSnapshot;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KpiProgressSnapshotRepository extends JpaRepository<KpiProgressSnapshot, Long> {

    Optional<KpiProgressSnapshot> findTopByKpiIdAndUserIdOrderByRecordedAtDesc(
            UUID kpiId, UUID userId);
}

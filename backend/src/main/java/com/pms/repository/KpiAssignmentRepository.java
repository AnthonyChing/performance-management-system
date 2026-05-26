package com.pms.repository;

import com.pms.entity.KpiAssignment;
import com.pms.entity.KpiAssignmentId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KpiAssignmentRepository extends JpaRepository<KpiAssignment, KpiAssignmentId> {

    List<KpiAssignment> findByUserId(UUID userId);

    List<KpiAssignment> findByUserIdAndKpiIdIn(UUID userId, List<UUID> kpiIds);
}

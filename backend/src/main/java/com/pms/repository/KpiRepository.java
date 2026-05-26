package com.pms.repository;

import com.pms.entity.Kpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KpiRepository extends JpaRepository<Kpi, UUID> {

    List<Kpi> findByCycleIdAndDeletedAtIsNull(UUID cycleId);
}

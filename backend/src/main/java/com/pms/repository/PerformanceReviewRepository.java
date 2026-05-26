package com.pms.repository;

import com.pms.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {

    Optional<PerformanceReview> findByCycleIdAndEmployeeId(UUID cycleId, UUID employeeId);

    List<PerformanceReview> findByEmployeeId(UUID employeeId);
}

package com.pms.repository;

import com.pms.entity.PerformanceCycle;
import com.pms.entity.enums.CycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PerformanceCycleRepository extends JpaRepository<PerformanceCycle, UUID> {

    // Native queries cast status::text to avoid type mismatch with PostgreSQL custom enum
    @Query(value = "SELECT * FROM performance_cycles WHERE status::text IN (:statuses)", nativeQuery = true)
    List<PerformanceCycle> findByStatusInStrings(@Param("statuses") Collection<String> statuses);

    @Query(value = "SELECT * FROM performance_cycles WHERE status::text IN (:statuses) ORDER BY hr_review_end DESC",
           countQuery = "SELECT count(*) FROM performance_cycles WHERE status::text IN (:statuses)",
           nativeQuery = true)
    Page<PerformanceCycle> findByStatusInStringsOrderByHrReviewEndDesc(@Param("statuses") Collection<String> statuses, Pageable pageable);

    default List<PerformanceCycle> findByStatusIn(List<CycleStatus> statuses) {
        return findByStatusInStrings(statuses.stream().map(CycleStatus::getDbValue).toList());
    }

    default Page<PerformanceCycle> findByStatusInOrderByHrReviewEndDesc(List<CycleStatus> statuses, Pageable pageable) {
        return findByStatusInStringsOrderByHrReviewEndDesc(statuses.stream().map(CycleStatus::getDbValue).toList(), pageable);
    }

    @Query(value = """
            SELECT * FROM performance_cycles
            WHERE (:status IS NULL OR status::text = :status)
            ORDER BY created_at DESC
            """,
            countQuery = """
            SELECT count(*) FROM performance_cycles
            WHERE (:status IS NULL OR status::text = :status)
            """,
            nativeQuery = true)
    Page<PerformanceCycle> findAllFiltered(@Param("status") String status, Pageable pageable);

    Optional<PerformanceCycle> findById(UUID id);
}

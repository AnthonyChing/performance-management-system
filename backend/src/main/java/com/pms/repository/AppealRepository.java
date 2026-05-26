package com.pms.repository;

import com.pms.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, UUID> {

    Optional<Appeal> findByReviewId(UUID reviewId);

    @Query(value = """
            SELECT * FROM appeals
            WHERE assigned_to = :managerId
              AND (:status IS NULL OR status::text = :status)
            ORDER BY filed_at DESC
            """, nativeQuery = true)
    List<Appeal> findByAssignedToFiltered(
            @Param("managerId") UUID managerId,
            @Param("status") String status);

    Optional<Appeal> findByIdAndAssignedTo(UUID id, UUID assignedTo);
}

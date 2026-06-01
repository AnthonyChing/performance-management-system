package com.pms.repository;

import com.pms.entity.Appeal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, UUID> {

    Optional<Appeal> findByReviewId(UUID reviewId);

    @Query(
            value =
                    """
            SELECT * FROM appeals
            WHERE assigned_to = :managerId
              AND (CAST(:status AS text) IS NULL OR status::text = :status)
            ORDER BY filed_at DESC
            """,
            nativeQuery = true)
    List<Appeal> findByAssignedToFiltered(
            @Param("managerId") UUID managerId, @Param("status") String status);

    Optional<Appeal> findByIdAndAssignedTo(UUID id, UUID assignedTo);
}

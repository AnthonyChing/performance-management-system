package com.pms.repository;

import com.pms.entity.GoalReview;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GoalReviewRepository extends JpaRepository<GoalReview, UUID> {

    Optional<GoalReview> findTopByGoalIdOrderByReviewedAtDesc(UUID goalId);

    @Query(
            value =
                    "SELECT DISTINCT ON (goal_id) * FROM goal_reviews WHERE goal_id IN (:goalIds) ORDER BY goal_id, reviewed_at DESC",
            nativeQuery = true)
    List<GoalReview> findLatestByGoalIds(@Param("goalIds") List<UUID> goalIds);
}

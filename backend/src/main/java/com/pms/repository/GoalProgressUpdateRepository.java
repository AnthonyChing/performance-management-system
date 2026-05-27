package com.pms.repository;

import com.pms.entity.GoalProgressUpdate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GoalProgressUpdateRepository extends JpaRepository<GoalProgressUpdate, UUID> {

    Optional<GoalProgressUpdate> findTopByGoalIdOrderByRecordedAtDesc(UUID goalId);

    @Query(
            value =
                    "SELECT DISTINCT ON (goal_id) * FROM goal_progress_updates WHERE goal_id IN (:goalIds) ORDER BY goal_id, recorded_at DESC",
            nativeQuery = true)
    List<GoalProgressUpdate> findLatestByGoalIds(@Param("goalIds") List<UUID> goalIds);
}

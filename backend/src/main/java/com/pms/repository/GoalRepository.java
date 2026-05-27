package com.pms.repository;

import com.pms.entity.Goal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findByCycleIdAndOwnerIdAndDeletedAtIsNull(UUID cycleId, UUID ownerId);

    Page<Goal> findByCycleIdAndOwnerIdAndDeletedAtIsNull(
            UUID cycleId, UUID ownerId, Pageable pageable);

    Optional<Goal> findByIdAndDeletedAtIsNull(UUID id);

    List<Goal> findByOwnerIdAndDeletedAtIsNull(UUID ownerId);
}

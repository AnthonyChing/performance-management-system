package com.pms.repository;

import com.pms.entity.Goal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findByCycleIdAndOwnerIdAndDeletedAtIsNull(UUID cycleId, UUID ownerId);

    Page<Goal> findByCycleIdAndOwnerIdAndDeletedAtIsNull(UUID cycleId, UUID ownerId, Pageable pageable);
}

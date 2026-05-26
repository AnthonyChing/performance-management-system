package com.pms.repository;

import com.pms.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, UUID> {

    Optional<Appeal> findByReviewId(UUID reviewId);
}

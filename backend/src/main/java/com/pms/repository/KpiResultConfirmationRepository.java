package com.pms.repository;

import com.pms.entity.KpiResultConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KpiResultConfirmationRepository extends JpaRepository<KpiResultConfirmation, UUID> {

    Optional<KpiResultConfirmation> findByReviewId(UUID reviewId);
}

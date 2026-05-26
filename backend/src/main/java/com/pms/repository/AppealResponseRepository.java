package com.pms.repository;

import com.pms.entity.AppealResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppealResponseRepository extends JpaRepository<AppealResponse, UUID> {

    Optional<AppealResponse> findTopByAppealIdOrderByRespondedAtDesc(UUID appealId);

    List<AppealResponse> findByAppealIdOrderByRespondedAtAsc(UUID appealId);
}

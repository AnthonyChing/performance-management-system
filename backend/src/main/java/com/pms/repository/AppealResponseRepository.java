package com.pms.repository;

import com.pms.entity.AppealResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppealResponseRepository extends JpaRepository<AppealResponse, UUID> {

    Optional<AppealResponse> findTopByAppealIdOrderByRespondedAtDesc(UUID appealId);

    List<AppealResponse> findByAppealIdOrderByRespondedAtAsc(UUID appealId);
}

package com.pms.repository;

import com.pms.entity.ReviewResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewResponseRepository extends JpaRepository<ReviewResponse, UUID> {

    List<ReviewResponse> findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(UUID reviewId, String respondentType);

    Optional<ReviewResponse> findByReviewIdAndQuestionIdAndRespondentType(UUID reviewId, UUID questionId, String respondentType);
}

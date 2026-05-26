package com.pms.repository;

import com.pms.entity.ReviewResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewResponseRepository extends JpaRepository<ReviewResponse, UUID> {

    List<ReviewResponse> findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(
            UUID reviewId, String respondentType);

    Optional<ReviewResponse> findByReviewIdAndQuestionIdAndRespondentType(
            UUID reviewId, UUID questionId, String respondentType);
}

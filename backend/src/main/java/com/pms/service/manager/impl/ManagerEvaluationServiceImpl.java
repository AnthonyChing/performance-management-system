package com.pms.service.manager.impl;

import com.pms.audit.Auditable;
import com.pms.dto.manager.evaluation.KpiEvaluationItemDTO;
import com.pms.dto.manager.evaluation.ManagerEvaluationResponseDTO;
import com.pms.dto.manager.evaluation.ManagerEvaluationUpdateRequestDTO;
import com.pms.dto.manager.evaluation.ManagerKpiEvaluationUpdateRequestDTO;
import com.pms.dto.manager.evaluation.ManagerQuestionnaireResponseDTO;
import com.pms.dto.manager.evaluation.ManagerQuestionnaireUpdateRequestDTO;
import com.pms.dto.manager.evaluation.QuestionnaireAnswerDTO;
import com.pms.dto.manager.evaluation.QuestionnaireResponseItemDTO;
import com.pms.entity.KpiEvaluation;
import com.pms.entity.PerformanceReview;
import com.pms.entity.ReviewResponse;
import com.pms.entity.User;
import com.pms.entity.enums.RatingScale;
import com.pms.entity.enums.ReviewStatus;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.*;
import com.pms.service.manager.ManagerEvaluationService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerEvaluationServiceImpl implements ManagerEvaluationService {

    private static final String RESPONDENT_TYPE = "manager";
    private static final java.util.Set<ReviewStatus> MANAGER_EVAL_STATUSES =
            java.util.Set.of(
                    ReviewStatus.PENDING_MANAGER_EVAL, ReviewStatus.MANAGER_EVAL_IN_PROGRESS);

    private final PerformanceReviewRepository reviewRepo;
    private final ReviewResponseRepository reviewResponseRepo;
    private final KpiEvaluationRepository kpiEvalRepo;
    private final UserRepository userRepo;
    private final PerformanceCycleRepository cycleRepo;

    @Override
    @Transactional
    @Auditable(
            action = "SAVE_EVALUATION",
            resource = "performance_review",
            resourceIdFrom = "evaluationId")
    public ManagerEvaluationResponseDTO updateEvaluation(
            UUID managerId,
            UUID subordinateId,
            UUID evaluationId,
            ManagerEvaluationUpdateRequestDTO req) {

        PerformanceReview review = getReviewAndValidate(managerId, subordinateId, evaluationId);
        if (!MANAGER_EVAL_STATUSES.contains(review.getStatus())) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Review is not in manager evaluation phase");
        }
        if ("completed".equals(req.getStatus())
                && (req.getResponses() == null || req.getResponses().isEmpty())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Responses are required when completing evaluation");
        }

        if (req.getResponses() != null) {
            for (QuestionnaireAnswerDTO ans : req.getResponses()) {
                ReviewResponse existing =
                        reviewResponseRepo
                                .findByReviewIdAndQuestionIdAndRespondentType(
                                        evaluationId, ans.getQuestionId(), RESPONDENT_TYPE)
                                .orElse(null);
                if (existing != null) {
                    existing.setRatingValue(ans.getRatingValue());
                    existing.setTextValue(ans.getTextValue());
                    existing.setRespondedAt(OffsetDateTime.now());
                    reviewResponseRepo.save(existing);
                } else {
                    reviewResponseRepo.save(
                            ReviewResponse.builder()
                                    .id(UUID.randomUUID())
                                    .reviewId(evaluationId)
                                    .questionId(ans.getQuestionId())
                                    .respondentId(managerId)
                                    .respondentType(RESPONDENT_TYPE)
                                    .ratingValue(ans.getRatingValue())
                                    .textValue(ans.getTextValue())
                                    .respondedAt(OffsetDateTime.now())
                                    .build());
                }
            }
        }

        if (req.getStatus() != null) review.setStatus(parseReviewStatus(req.getStatus()));
        if (req.getFinalRating() != null)
            review.setFinalRating(parseRatingScale(req.getFinalRating()));
        if (req.getManagerComment() != null) review.setManagerComment(req.getManagerComment());
        if (review.getStatus() == ReviewStatus.PENDING_HR_REVIEW
                || review.getStatus() == ReviewStatus.COMPLETED) {
            review.setManagerSubmittedAt(OffsetDateTime.now());
        }
        reviewRepo.save(review);

        return ManagerEvaluationResponseDTO.from(
                review,
                reviewResponseRepo.findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(
                        evaluationId, RESPONDENT_TYPE),
                kpiEvalRepo.findByReviewId(evaluationId));
    }

    @Override
    @Transactional
    @Auditable(
            action = "SAVE_QUESTIONNAIRE",
            resource = "performance_review",
            resourceIdFrom = "evaluationId")
    public ManagerQuestionnaireResponseDTO updateQuestionnaire(
            UUID managerId,
            UUID subordinateId,
            UUID evaluationId,
            ManagerQuestionnaireUpdateRequestDTO req) {

        PerformanceReview review = getReviewAndValidate(managerId, subordinateId, evaluationId);
        if (!MANAGER_EVAL_STATUSES.contains(review.getStatus())) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Review is not in manager evaluation phase");
        }
        if (review.getStatus() == ReviewStatus.PENDING_MANAGER_EVAL) {
            review.setStatus(ReviewStatus.MANAGER_EVAL_IN_PROGRESS);
            reviewRepo.save(review);
        }

        for (QuestionnaireAnswerDTO ans : req.getResponses()) {
            ReviewResponse existing =
                    reviewResponseRepo
                            .findByReviewIdAndQuestionIdAndRespondentType(
                                    evaluationId, ans.getQuestionId(), RESPONDENT_TYPE)
                            .orElse(null);
            if (existing != null) {
                existing.setRatingValue(ans.getRatingValue());
                existing.setTextValue(ans.getTextValue());
                existing.setRespondedAt(OffsetDateTime.now());
                reviewResponseRepo.save(existing);
            } else {
                reviewResponseRepo.save(
                        ReviewResponse.builder()
                                .id(UUID.randomUUID())
                                .reviewId(evaluationId)
                                .questionId(ans.getQuestionId())
                                .respondentId(managerId)
                                .respondentType(RESPONDENT_TYPE)
                                .ratingValue(ans.getRatingValue())
                                .textValue(ans.getTextValue())
                                .respondedAt(OffsetDateTime.now())
                                .build());
            }
        }

        List<ReviewResponse> saved =
                reviewResponseRepo.findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(
                        evaluationId, RESPONDENT_TYPE);
        return ManagerQuestionnaireResponseDTO.builder()
                .reviewId(evaluationId)
                .responses(saved.stream().map(QuestionnaireResponseItemDTO::from).toList())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Override
    @Transactional
    @Auditable(
            action = "SAVE_KPI_EVALUATION",
            resource = "performance_review",
            resourceIdFrom = "evaluationId")
    public ManagerEvaluationResponseDTO updateKpiEvaluation(
            UUID managerId,
            UUID subordinateId,
            UUID evaluationId,
            ManagerKpiEvaluationUpdateRequestDTO req) {

        PerformanceReview review = getReviewAndValidate(managerId, subordinateId, evaluationId);
        if (!MANAGER_EVAL_STATUSES.contains(review.getStatus())) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Review is not in manager evaluation phase");
        }

        if (req.getStatus() != null) review.setStatus(parseReviewStatus(req.getStatus()));
        if (req.getFinalRating() != null)
            review.setFinalRating(parseRatingScale(req.getFinalRating()));
        if (req.getManagerComment() != null) review.setManagerComment(req.getManagerComment());
        if (review.getStatus() == ReviewStatus.PENDING_HR_REVIEW
                || review.getStatus() == ReviewStatus.COMPLETED) {
            review.setManagerSubmittedAt(OffsetDateTime.now());
        }
        reviewRepo.save(review);

        if (req.getKpiEvaluations() != null) {
            for (KpiEvaluationItemDTO item : req.getKpiEvaluations()) {
                KpiEvaluation eval =
                        kpiEvalRepo
                                .findByReviewIdAndKpiId(evaluationId, item.getKpiId())
                                .orElse(
                                        KpiEvaluation.builder()
                                                .id(UUID.randomUUID())
                                                .reviewId(evaluationId)
                                                .kpiId(item.getKpiId())
                                                .evaluatedAt(OffsetDateTime.now())
                                                .build());
                eval.setManagerScore(item.getManagerScore());
                eval.setManagerFeedback(item.getManagerFeedback());
                eval.setEvaluatedAt(OffsetDateTime.now());
                kpiEvalRepo.save(eval);
            }
        }

        return ManagerEvaluationResponseDTO.from(
                review,
                reviewResponseRepo.findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(
                        evaluationId, RESPONDENT_TYPE),
                kpiEvalRepo.findByReviewId(evaluationId));
    }

    @Override
    public List<ManagerEvaluationResponseDTO> listEvaluations(
            UUID managerId, UUID subordinateId, String cycleId) {
        assertDirectSubordinate(managerId, subordinateId);
        List<PerformanceReview> reviews =
                reviewRepo.findByEmployeeId(subordinateId).stream()
                        .filter(
                                r ->
                                        r.getManagerId().equals(managerId)
                                                || r.getEmployeeId().equals(subordinateId))
                        .toList();
        if (cycleId != null) {
            UUID cid = UUID.fromString(cycleId);
            reviews = reviews.stream().filter(r -> r.getCycleId().equals(cid)).toList();
        }

        List<UUID> cycleIds =
                reviews.stream().map(PerformanceReview::getCycleId).distinct().toList();
        java.util.Map<UUID, String> cycleMap = new java.util.HashMap<>();
        cycleRepo.findAllById(cycleIds).forEach(c -> cycleMap.put(c.getId(), c.getName()));

        return reviews.stream()
                .map(
                        r -> {
                            String cycleName = cycleMap.get(r.getCycleId());
                            return ManagerEvaluationResponseDTO.from(
                                    r,
                                    cycleName,
                                    reviewResponseRepo
                                            .findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(
                                                    r.getId(), RESPONDENT_TYPE),
                                    kpiEvalRepo.findByReviewId(r.getId()));
                        })
                .toList();
    }

    private PerformanceReview getReviewAndValidate(
            UUID managerId, UUID subordinateId, UUID evaluationId) {
        assertDirectSubordinate(managerId, subordinateId);
        PerformanceReview review =
                reviewRepo
                        .findById(evaluationId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Evaluation not found"));
        if (!review.getEmployeeId().equals(subordinateId)) {
            throw new ForbiddenException(
                    "FORBIDDEN", "This evaluation does not belong to the specified employee");
        }
        if (!review.getManagerId().equals(managerId)) {
            throw new ForbiddenException(
                    "FORBIDDEN", "You are not the assigned manager for this evaluation");
        }
        return review;
    }

    private void assertDirectSubordinate(UUID managerId, UUID subordinateId) {
        User sub =
                userRepo.findById(subordinateId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "SUBORDINATE_NOT_FOUND", "Employee not found"));
        if (!managerId.equals(sub.getManagerId())) {
            throw new ForbiddenException("FORBIDDEN", "You do not manage this employee");
        }
    }

    private ReviewStatus parseReviewStatus(String value) {
        try {
            return ReviewStatus.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid status: " + value);
        }
    }

    private RatingScale parseRatingScale(String value) {
        try {
            return RatingScale.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid final_rating: " + value);
        }
    }
}

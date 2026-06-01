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
import com.pms.entity.KpiAssignment;
import com.pms.entity.KpiEvaluation;
import com.pms.entity.PerformanceReview;
import com.pms.entity.ReviewResponse;
import com.pms.entity.TemplateQuestion;
import com.pms.entity.User;
import com.pms.entity.enums.RatingScale;
import com.pms.entity.enums.ReviewStatus;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.*;
import com.pms.service.manager.ManagerEvaluationService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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
    private final KpiAssignmentRepository kpiAssignmentRepo;
    private final TemplateQuestionRepository templateQuestionRepo;

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
        if (req.getFinalRating() != null) {
            review.setFinalRating(parseRatingScale(req.getFinalRating()));
        }
        if (req.getManagerComment() != null) {
            review.setManagerComment(req.getManagerComment());
        }
        if (review.getStatus() == ReviewStatus.PENDING_HR_REVIEW
                || review.getStatus() == ReviewStatus.COMPLETED) {
            review.setManagerSubmittedAt(OffsetDateTime.now());
        }
        recomputeScoresAndRating(review);
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

        recomputeScoresAndRating(review);
        reviewRepo.save(review);

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
        if (req.getFinalRating() != null) {
            review.setFinalRating(parseRatingScale(req.getFinalRating()));
        }
        if (req.getManagerComment() != null) {
            review.setManagerComment(req.getManagerComment());
        }
        if (review.getStatus() == ReviewStatus.PENDING_HR_REVIEW
                || review.getStatus() == ReviewStatus.COMPLETED) {
            review.setManagerSubmittedAt(OffsetDateTime.now());
        }

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

        recomputeScoresAndRating(review);
        reviewRepo.save(review);

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

    private void recomputeScoresAndRating(PerformanceReview review) {
        BigDecimal kpiScore = computeKpiScore(review);
        BigDecimal reviewScore = computeQuestionnaireScore(review.getId());
        review.setKpiScore(kpiScore);
        review.setReviewScore(reviewScore);

        if (kpiScore != null || reviewScore != null) {
            review.setScoreComputedAt(OffsetDateTime.now());
        }
        if (kpiScore != null && reviewScore != null) {
            BigDecimal finalScore =
                    kpiScore.add(reviewScore)
                            .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            review.setFinalRating(toRatingScale(finalScore));
        }
    }

    private BigDecimal computeKpiScore(PerformanceReview review) {
        List<KpiEvaluation> evaluations =
                kpiEvalRepo.findByReviewId(review.getId()).stream()
                        .filter(e -> e.getManagerScore() != null)
                        .toList();
        if (evaluations.isEmpty()) {
            return null;
        }

        List<UUID> kpiIds = evaluations.stream().map(KpiEvaluation::getKpiId).toList();
        Map<UUID, BigDecimal> weightByKpiId =
                kpiAssignmentRepo.findByUserIdAndKpiIdIn(review.getEmployeeId(), kpiIds).stream()
                        .collect(
                                Collectors.toMap(
                                        KpiAssignment::getKpiId, KpiAssignment::getWeight));

        BigDecimal weightedTotal = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal unweightedTotal = BigDecimal.ZERO;
        int unweightedCount = 0;

        for (KpiEvaluation evaluation : evaluations) {
            BigDecimal score = evaluation.getManagerScore();
            BigDecimal weight = weightByKpiId.get(evaluation.getKpiId());
            if (weight != null && weight.compareTo(BigDecimal.ZERO) > 0) {
                weightedTotal = weightedTotal.add(score.multiply(weight));
                totalWeight = totalWeight.add(weight);
            } else {
                unweightedTotal = unweightedTotal.add(score);
                unweightedCount++;
            }
        }

        if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
            return weightedTotal.divide(totalWeight, 2, RoundingMode.HALF_UP);
        }
        return unweightedTotal.divide(BigDecimal.valueOf(unweightedCount), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal computeQuestionnaireScore(UUID reviewId) {
        List<ReviewResponse> ratingResponses =
                reviewResponseRepo
                        .findByReviewIdAndRespondentTypeOrderByRespondedAtAsc(
                                reviewId, RESPONDENT_TYPE)
                        .stream()
                        .filter(r -> r.getRatingValue() != null)
                        .toList();
        if (ratingResponses.isEmpty()) {
            return null;
        }

        List<UUID> questionIds =
                ratingResponses.stream().map(ReviewResponse::getQuestionId).toList();
        Map<UUID, TemplateQuestion> questionById =
                templateQuestionRepo.findByIdInAndDeletedAtIsNull(questionIds).stream()
                        .collect(Collectors.toMap(TemplateQuestion::getId, Function.identity()));

        List<BigDecimal> normalizedScores =
                ratingResponses.stream()
                        .map(
                                response -> {
                                    TemplateQuestion question =
                                            questionById.get(response.getQuestionId());
                                    Integer scaleMax =
                                            question != null ? question.getRatingScaleMax() : null;
                                    if (scaleMax == null || scaleMax <= 0) {
                                        return null;
                                    }
                                    return BigDecimal.valueOf(response.getRatingValue())
                                            .multiply(BigDecimal.valueOf(100))
                                            .divide(
                                                    BigDecimal.valueOf(scaleMax),
                                                    2,
                                                    RoundingMode.HALF_UP);
                                })
                        .filter(Objects::nonNull)
                        .toList();
        if (normalizedScores.isEmpty()) {
            return null;
        }

        BigDecimal total = normalizedScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(normalizedScores.size()), 2, RoundingMode.HALF_UP);
    }

    private RatingScale toRatingScale(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(90)) >= 0) {
            return RatingScale.OUTSTANDING;
        }
        if (score.compareTo(BigDecimal.valueOf(80)) >= 0) {
            return RatingScale.EXCEEDS_EXPECTATIONS;
        }
        if (score.compareTo(BigDecimal.valueOf(70)) >= 0) {
            return RatingScale.MEETS_EXPECTATIONS;
        }
        if (score.compareTo(BigDecimal.valueOf(60)) >= 0) {
            return RatingScale.NEEDS_IMPROVEMENT;
        }
        return RatingScale.UNACCEPTABLE;
    }
}

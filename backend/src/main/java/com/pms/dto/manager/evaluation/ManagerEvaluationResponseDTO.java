package com.pms.dto.manager.evaluation;

import com.pms.entity.KpiEvaluation;
import com.pms.entity.PerformanceReview;
import com.pms.entity.ReviewResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerEvaluationResponseDTO {
    private UUID id;
    private UUID cycleId;
    private String cycleName;
    private UUID employeeId;
    private UUID managerId;
    private String status;
    private String finalRating;
    private String managerComment;
    private List<QuestionnaireResponseItemDTO> responses;
    private List<KpiEvaluationItemDTO> kpiEvaluations;
    private List<EvaluationQuestionDTO> questions;
    private OffsetDateTime managerSubmittedAt;
    private OffsetDateTime updatedAt;

    @Getter
    @Builder
    public static class EvaluationQuestionDTO {
        private UUID id;
        private String question_text;
        private String question_type;
        private Integer rating_scale_max;
        private boolean is_required;
        private Integer sort_order;
    }

    public static ManagerEvaluationResponseDTO from(
            PerformanceReview review,
            List<ReviewResponse> responses,
            List<KpiEvaluation> kpiEvals,
            List<com.pms.entity.TemplateQuestion> questions) {
        return from(review, null, responses, kpiEvals, questions);
    }

    public static ManagerEvaluationResponseDTO from(
            PerformanceReview review,
            String cycleName,
            List<ReviewResponse> responses,
            List<KpiEvaluation> kpiEvals,
            List<com.pms.entity.TemplateQuestion> questions) {
        return ManagerEvaluationResponseDTO.builder()
                .id(review.getId())
                .cycleId(review.getCycleId())
                .cycleName(cycleName)
                .employeeId(review.getEmployeeId())
                .managerId(review.getManagerId())
                .status(review.getStatus() != null ? review.getStatus().getDbValue() : null)
                .finalRating(
                        review.getFinalRating() != null
                                ? review.getFinalRating().getDbValue()
                                : null)
                .managerComment(review.getManagerComment())
                .responses(responses.stream().map(QuestionnaireResponseItemDTO::from).toList())
                .kpiEvaluations(
                        kpiEvals.stream()
                                .map(
                                        e -> {
                                            KpiEvaluationItemDTO d = new KpiEvaluationItemDTO();
                                            d.setKpiId(e.getKpiId());
                                            d.setManagerScore(e.getManagerScore());
                                            d.setManagerFeedback(e.getManagerFeedback());
                                            return d;
                                        })
                                .toList())
                .questions(
                        questions != null
                                ? questions.stream()
                                        .map(
                                                q ->
                                                        EvaluationQuestionDTO.builder()
                                                                .id(q.getId())
                                                                .question_text(q.getQuestionText())
                                                                .question_type(
                                                                        q.getQuestionType() != null
                                                                                ? q.getQuestionType()
                                                                                        .getDbValue()
                                                                                : null)
                                                                .rating_scale_max(
                                                                        q.getRatingScaleMax())
                                                                .is_required(
                                                                        q.getIsRequired() != null
                                                                                ? q.getIsRequired()
                                                                                : false)
                                                                .sort_order(q.getSortOrder())
                                                                .build())
                                        .toList()
                                : java.util.Collections.emptyList())
                .managerSubmittedAt(review.getManagerSubmittedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}

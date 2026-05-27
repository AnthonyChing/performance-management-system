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
    private UUID employeeId;
    private UUID managerId;
    private String status;
    private String finalRating;
    private String managerComment;
    private List<QuestionnaireResponseItemDTO> responses;
    private List<KpiEvaluationItemDTO> kpiEvaluations;
    private OffsetDateTime managerSubmittedAt;
    private OffsetDateTime updatedAt;

    public static ManagerEvaluationResponseDTO from(
            PerformanceReview review,
            List<ReviewResponse> responses,
            List<KpiEvaluation> kpiEvals) {
        return ManagerEvaluationResponseDTO.builder()
                .id(review.getId())
                .cycleId(review.getCycleId())
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
                .managerSubmittedAt(review.getManagerSubmittedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}

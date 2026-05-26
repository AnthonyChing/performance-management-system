package com.pms.dto.employee.appeal;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.kpi.KpiResultSummaryDTO.DisputePeriodDTO;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AppealResponsesDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppealsResponseDTO {
        private String mode;
        private CycleSummaryDTO period;
        private DisputePeriodDTO appealPeriod;
        private AppealReviewResultDTO reviewResult;
        private AppealDTO currentAppeal;
        private AvailableActionsDTO availableActions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppealSubmitRequestDTO {
        @NotBlank(message = "Period ID is required")
        private String periodId;
        @NotBlank(message = "Reason is required")
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppealSubmitResponseDTO {
        private AppealDTO appeal;
        private AvailableActionsDTO availableActions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppealResultResponseDTO {
        private AppealDTO appeal;
        private AppealReviewResultDTO reviewResult;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppealReviewResultDTO {
        private String reviewId;
        private String finalRating;
        private Double kpiScore;
        private Double reviewScore;
        private String managerComment;
    }
}

package com.pms.dto.employee.kpi;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiResultSummaryDTO {
    private String resultId;
    private CycleSummaryDTO cycle;
    private EmployeeSummaryDTO employee;
    private String status;
    private OffsetDateTime publishedAt;
    private ScoreSummaryDTO scoreSummary;
    private Double weightedScore;
    private Double reviewScore;
    private String finalGrade;
    private ManagerEvaluationDTO managerEvaluation;
    private List<KpiResultDTO> kpiResults;
    private AvailableActionsDTO availableActions;
    private KpiConfirmationDTO confirmation;
    private DisputePeriodDTO disputePeriod;
    private OffsetDateTime reviewedAt;
    private OffsetDateTime updatedAt;
    private Double performanceScore;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeSummaryDTO {
        private String userId;
        private String name;
        private String department;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreSummaryDTO {
        private Double performanceScore;
        private Double kpiAchievementPercent;
        private Double managerReviewScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerEvaluationDTO {
        private Double score;
        private String comment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiConfirmationDTO {
        private String confirmationId;
        private String resultId;
        private OffsetDateTime confirmedAt;
        private EmployeeSummaryDTO confirmedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisputePeriodDTO {
        private String status;
        private String startDate;
        private String endDate;
        private String timezone;
    }
}

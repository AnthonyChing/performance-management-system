package com.pms.dto.employee.goal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalSummaryDTO {
    private Integer totalCount;
    private Integer pendingReviewCount;
    private Integer inProgressCount;
    private Integer revisionRequestedCount;
    private Integer completedCount;
    private Integer cancelledCount;

    // For historical
    private Double averageCompletionPercent;
    private Integer goalCount;
}

package com.pms.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CycleSummaryDTO {
    private String cycleId;
    private String name;
    private String cycleType;
    private String periodLabel;
    private String reviewType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String timezone;
    private String status;
    private Boolean isLocked;
    private Boolean isReviewLocked;
    private OffsetDateTime reviewLockedAt;
    private OffsetDateTime resultsPublishedAt;
    private OffsetDateTime updatedAt;
    // Specific to historical summary
    private Double averageCompletionPercent;
    private Integer goalCount;
}

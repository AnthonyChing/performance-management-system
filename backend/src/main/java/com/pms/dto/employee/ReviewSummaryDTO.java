package com.pms.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSummaryDTO {
    private String reviewId;
    private String status;
    private ManagerDTO manager;
    private ManagerDTO coManager;
    private OffsetDateTime submittedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime updatedAt;
}

package com.pms.dto.employee;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

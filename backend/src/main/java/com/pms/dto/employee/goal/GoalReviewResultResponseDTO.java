package com.pms.dto.employee.goal;

import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.ManagerDTO;
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
public class GoalReviewResultResponseDTO {
    private CycleSummaryDTO cycle;
    private String overallStatus;
    private GoalSummaryDTO summary;
    private OffsetDateTime reviewedAt;
    private ManagerDTO reviewer;
    private List<GoalReviewResultDTO> results;
}

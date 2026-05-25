package com.pms.dto.employee.goal;

import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.PaginationDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalGoalsResponseDTO {
    private String mode;
    private PaginationDTO pagination;
    private List<CycleSummaryDTO> historicalCycles;
    private CycleSummaryDTO cycle;
    private GoalSummaryDTO summary;
    private List<GoalDTO> goals;
}

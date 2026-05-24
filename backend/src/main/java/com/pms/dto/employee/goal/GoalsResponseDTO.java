package com.pms.dto.employee.goal;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalsResponseDTO {
    private CycleSummaryDTO cycle;
    private AvailableActionsDTO availableActions;
    private GoalSummaryDTO summary;
    private List<GoalDTO> goals;
}

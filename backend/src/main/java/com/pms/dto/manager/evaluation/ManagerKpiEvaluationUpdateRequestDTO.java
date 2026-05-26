package com.pms.dto.manager.evaluation;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter @NoArgsConstructor
public class ManagerKpiEvaluationUpdateRequestDTO {
    private String status;
    private String finalRating;
    private String managerComment;
    private List<KpiEvaluationItemDTO> kpiEvaluations;
}

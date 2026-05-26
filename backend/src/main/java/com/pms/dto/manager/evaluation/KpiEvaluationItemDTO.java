package com.pms.dto.manager.evaluation;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KpiEvaluationItemDTO {
    private UUID kpiId;
    private BigDecimal managerScore;
    private String managerFeedback;
}

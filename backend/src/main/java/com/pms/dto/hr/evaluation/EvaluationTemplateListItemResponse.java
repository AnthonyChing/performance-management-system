package com.pms.dto.hr.evaluation;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EvaluationTemplateListItemResponse {
    private UUID templateId;
    private EvalCycleInfoDto cycle;
    private String name;
    private String description;
    private String status;
    private EmployeeGroupDto employeeGroup;
    private Integer assessmentTemplateCount;
    private BigDecimal totalWeightPercent;
    private AvailableActionsDto availableActions;
    private OffsetDateTime updatedAt;
}

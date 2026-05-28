package com.pms.dto.hr.evaluation;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EvaluationTemplateResponse {
    private UUID templateId;
    private EvalCycleInfoDto cycle;
    private String name;
    private String description;
    private String status;
    private EmployeeGroupDto employeeGroup;
    private List<AssessmentTemplateComponentDto> assessmentTemplates;
    private BigDecimal totalWeightPercent;
    private AvailableActionsDto availableActions;
    private UUID createdBy;
    private UUID updatedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

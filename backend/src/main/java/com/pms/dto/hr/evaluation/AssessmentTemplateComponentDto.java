package com.pms.dto.hr.evaluation;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AssessmentTemplateComponentDto {
    private UUID assessmentTemplateId;
    private UUID assessmentTemplateVersionId;
    private String name;
    private Integer questionCount;
    private BigDecimal weightPercent;
}

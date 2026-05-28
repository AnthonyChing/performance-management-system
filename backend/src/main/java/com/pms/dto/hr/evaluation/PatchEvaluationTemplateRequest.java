package com.pms.dto.hr.evaluation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PatchEvaluationTemplateRequest {

    private UUID cycleId;

    @Size(max = 128)
    private String name;

    private String description;
    private String employeeGroupId;

    @Valid
    private List<AssessmentTemplateComponentRequest> assessmentTemplates;

    private String status;
}

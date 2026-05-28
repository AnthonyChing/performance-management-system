package com.pms.dto.hr.evaluation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateEvaluationTemplateRequest {

    @NotNull private UUID cycleId;

    @NotBlank
    @Size(max = 128)
    private String name;

    private String description;

    @NotBlank private String employeeGroupId;

    @NotEmpty @Valid private List<AssessmentTemplateComponentRequest> assessmentTemplates;
}

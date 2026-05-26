package com.pms.dto.hr.template;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class QuestionCreateRequestDTO {
    @NotBlank
    private String questionText;
    @NotNull
    private String questionType;
    private Integer ratingScaleMax;
    private Boolean isRequired = true;
}

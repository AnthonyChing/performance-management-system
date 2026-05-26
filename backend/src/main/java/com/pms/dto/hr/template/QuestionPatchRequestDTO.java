package com.pms.dto.hr.template;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class QuestionPatchRequestDTO {
    private String questionText;
    private String questionType;
    private Integer ratingScaleMax;
    private Boolean isRequired;
}

package com.pms.dto.manager.evaluation;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class QuestionnaireAnswerDTO {
    private UUID questionId;
    private Integer ratingValue;
    private String textValue;
}

package com.pms.dto.manager.evaluation;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor
public class QuestionnaireAnswerDTO {
    private UUID questionId;
    private Integer ratingValue;
    private String textValue;
}

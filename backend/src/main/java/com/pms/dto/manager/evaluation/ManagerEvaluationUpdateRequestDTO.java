package com.pms.dto.manager.evaluation;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter @NoArgsConstructor
public class ManagerEvaluationUpdateRequestDTO {
    private String status;
    private String finalRating;
    private String managerComment;
    private List<QuestionnaireAnswerDTO> responses;
}

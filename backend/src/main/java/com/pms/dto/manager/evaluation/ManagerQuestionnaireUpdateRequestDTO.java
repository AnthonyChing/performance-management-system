package com.pms.dto.manager.evaluation;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter @NoArgsConstructor
public class ManagerQuestionnaireUpdateRequestDTO {
    @NotNull
    private List<QuestionnaireAnswerDTO> responses;
}

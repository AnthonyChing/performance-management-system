package com.pms.dto.manager.evaluation;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ManagerQuestionnaireUpdateRequestDTO {
    @NotNull private List<QuestionnaireAnswerDTO> responses;
}

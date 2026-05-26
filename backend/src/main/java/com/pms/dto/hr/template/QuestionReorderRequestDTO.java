package com.pms.dto.hr.template;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor
public class QuestionReorderRequestDTO {
    @NotEmpty
    private List<UUID> orderedQuestionIds;
}

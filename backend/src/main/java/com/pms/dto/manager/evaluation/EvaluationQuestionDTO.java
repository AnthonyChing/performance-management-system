package com.pms.dto.manager.evaluation;

import com.pms.entity.TemplateQuestion;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EvaluationQuestionDTO {
    private UUID questionId;
    private String questionText;
    private String questionType;
    private Integer ratingScaleMax;
    private Boolean isRequired;
    private Integer sortOrder;

    public static EvaluationQuestionDTO from(TemplateQuestion q) {
        return EvaluationQuestionDTO.builder()
                .questionId(q.getId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType() != null ? q.getQuestionType().getDbValue() : null)
                .ratingScaleMax(q.getRatingScaleMax())
                .isRequired(q.getIsRequired())
                .sortOrder(q.getSortOrder())
                .build();
    }
}

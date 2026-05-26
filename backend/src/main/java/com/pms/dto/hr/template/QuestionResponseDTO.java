package com.pms.dto.hr.template;

import com.pms.entity.TemplateQuestion;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestionResponseDTO {
    private UUID id;
    private UUID templateId;
    private String questionText;
    private String questionType;
    private Integer ratingScaleMax;
    private Boolean isRequired;
    private Integer sortOrder;

    public static QuestionResponseDTO from(TemplateQuestion q) {
        return QuestionResponseDTO.builder()
                .id(q.getId())
                .templateId(q.getTemplateId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType().getDbValue())
                .ratingScaleMax(q.getRatingScaleMax())
                .isRequired(q.getIsRequired())
                .sortOrder(q.getSortOrder())
                .build();
    }
}

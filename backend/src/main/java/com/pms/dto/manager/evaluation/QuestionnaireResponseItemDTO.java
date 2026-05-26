package com.pms.dto.manager.evaluation;

import com.pms.entity.ReviewResponse;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestionnaireResponseItemDTO {
    private UUID id;
    private UUID questionId;
    private String respondentType;
    private Integer ratingValue;
    private String textValue;
    private OffsetDateTime respondedAt;

    public static QuestionnaireResponseItemDTO from(ReviewResponse r) {
        return QuestionnaireResponseItemDTO.builder()
                .id(r.getId())
                .questionId(r.getQuestionId())
                .respondentType(r.getRespondentType())
                .ratingValue(r.getRatingValue())
                .textValue(r.getTextValue())
                .respondedAt(r.getRespondedAt())
                .build();
    }
}

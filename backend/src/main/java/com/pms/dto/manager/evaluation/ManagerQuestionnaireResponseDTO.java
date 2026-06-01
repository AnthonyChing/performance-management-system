package com.pms.dto.manager.evaluation;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerQuestionnaireResponseDTO {
    private UUID reviewId;
    private List<EvaluationQuestionDTO> questions;
    private List<QuestionnaireResponseItemDTO> responses;
    private OffsetDateTime updatedAt;
}

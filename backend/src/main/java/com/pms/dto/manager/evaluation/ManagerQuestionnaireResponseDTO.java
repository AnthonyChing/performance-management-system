package com.pms.dto.manager.evaluation;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Builder
public class ManagerQuestionnaireResponseDTO {
    private UUID reviewId;
    private List<QuestionnaireResponseItemDTO> responses;
    private OffsetDateTime updatedAt;
}

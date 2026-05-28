package com.pms.dto.hr.template;

import com.pms.entity.AssessmentTemplate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TemplateResponseDTO {
    private UUID id;
    private String name;
    private String description;
    private String jobCategory;
    private String status;
    private Boolean isActive;
    private Long usageCount;
    private UUID createdBy;
    private UUID updatedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime deletedAt;

    public static TemplateResponseDTO from(AssessmentTemplate t, long usageCount) {
        return TemplateResponseDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .description(t.getDescription())
                .jobCategory(t.getJobCategory())
                .status(t.getStatus().getDbValue())
                .isActive(t.getIsActive())
                .usageCount(usageCount)
                .createdBy(t.getCreatedBy())
                .updatedBy(t.getUpdatedBy())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .deletedAt(t.getDeletedAt())
                .build();
    }
}

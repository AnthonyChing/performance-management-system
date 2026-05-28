package com.pms.dto.hr.template;

import com.pms.entity.AssessmentTemplate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TemplateListItemDTO {
    private UUID id;
    private String name;
    private String jobCategory;
    private String status;
    private Boolean isActive;

    public static TemplateListItemDTO from(AssessmentTemplate t) {
        return TemplateListItemDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .jobCategory(t.getJobCategory())
                .status(t.getStatus().getDbValue())
                .isActive(t.getIsActive())
                .build();
    }
}

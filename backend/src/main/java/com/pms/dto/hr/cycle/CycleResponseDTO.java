package com.pms.dto.hr.cycle;

import com.pms.entity.PerformanceCycle;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Builder
public class CycleResponseDTO {
    private UUID id;
    private String name;
    private String cycleType;
    private String status;
    private String timezone;
    private OffsetDateTime selfEvalStart;
    private OffsetDateTime selfEvalEnd;
    private OffsetDateTime managerEvalStart;
    private OffsetDateTime managerEvalEnd;
    private OffsetDateTime hrReviewEnd;
    private OffsetDateTime resultsPublishedAt;
    private Integer appealDeadlineDays;
    private Boolean isLocked;
    private UUID createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static CycleResponseDTO from(PerformanceCycle c) {
        return CycleResponseDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .cycleType(c.getCycleType().getDbValue())
                .status(c.getStatus().getDbValue())
                .timezone(c.getTimezone())
                .selfEvalStart(c.getSelfEvalStart())
                .selfEvalEnd(c.getSelfEvalEnd())
                .managerEvalStart(c.getManagerEvalStart())
                .managerEvalEnd(c.getManagerEvalEnd())
                .hrReviewEnd(c.getHrReviewEnd())
                .resultsPublishedAt(c.getResultsPublishedAt())
                .appealDeadlineDays(c.getAppealDeadlineDays())
                .isLocked(c.getIsLocked())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}

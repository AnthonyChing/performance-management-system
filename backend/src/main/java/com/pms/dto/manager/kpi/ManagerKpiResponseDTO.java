package com.pms.dto.manager.kpi;

import com.pms.entity.Kpi;
import com.pms.entity.KpiAssignment;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Builder
public class ManagerKpiResponseDTO {
    private UUID kpiId;
    private UUID cycleId;
    private UUID createdBy;
    private String kpiType;
    private String title;
    private String description;
    private String unit;
    private AssignmentDTO assignment;
    private OffsetDateTime publishedAt;

    @Getter @Builder
    public static class AssignmentDTO {
        private BigDecimal targetValue;
        private BigDecimal currentValue;
        private OffsetDateTime lastUpdatedAt;
    }

    public static ManagerKpiResponseDTO from(Kpi kpi, KpiAssignment assignment) {
        AssignmentDTO assignmentDTO = assignment == null ? null : AssignmentDTO.builder()
                .targetValue(assignment.getTargetValue())
                .currentValue(assignment.getCurrentValue())
                .lastUpdatedAt(assignment.getLastUpdatedAt())
                .build();
        return ManagerKpiResponseDTO.builder()
                .kpiId(kpi.getId())
                .cycleId(kpi.getCycleId())
                .createdBy(kpi.getCreatedBy())
                .kpiType(kpi.getKpiType() != null ? kpi.getKpiType().getDbValue() : null)
                .title(kpi.getTitle())
                .description(kpi.getDescription())
                .unit(kpi.getUnit())
                .assignment(assignmentDTO)
                .publishedAt(kpi.getPublishedAt())
                .build();
    }
}

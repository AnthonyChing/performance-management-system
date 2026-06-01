package com.pms.dto.manager.kpi;

import com.pms.entity.Kpi;
import com.pms.entity.KpiAssignment;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerKpiResponseDTO {
    private UUID id;
    private UUID cycleId;
    private UUID createdBy;
    private String kpiType;
    private String title;
    private String description;
    private String unit;
    private String targetOperator;
    private BigDecimal targetValue;
    private String targetUnit;
    private String targetDisplayText;
    private AssignmentDTO assignment;
    private OffsetDateTime publishedAt;

    @Getter
    @Builder
    public static class AssignmentDTO {
        private BigDecimal weight;
        private BigDecimal targetValue;
        private BigDecimal currentValue;
        private OffsetDateTime lastUpdatedAt;
    }

    public static ManagerKpiResponseDTO from(Kpi kpi, KpiAssignment assignment) {
        AssignmentDTO assignmentDTO =
                assignment == null
                        ? null
                        : AssignmentDTO.builder()
                                .weight(assignment.getWeight())
                                .targetValue(assignment.getTargetValue())
                                .currentValue(assignment.getCurrentValue())
                                .lastUpdatedAt(assignment.getLastUpdatedAt())
                                .build();
        return ManagerKpiResponseDTO.builder()
                .id(kpi.getId())
                .cycleId(kpi.getCycleId())
                .createdBy(kpi.getCreatedBy())
                .kpiType(kpi.getKpiType() != null ? kpi.getKpiType().getDbValue() : null)
                .title(kpi.getTitle())
                .description(kpi.getDescription())
                .unit(kpi.getUnit())
                .targetOperator(kpi.getTargetOperator())
                .targetValue(kpi.getTargetValue())
                .targetUnit(kpi.getTargetUnit())
                .targetDisplayText(kpi.getTargetDisplayText())
                .assignment(assignmentDTO)
                .publishedAt(kpi.getPublishedAt())
                .build();
    }
}

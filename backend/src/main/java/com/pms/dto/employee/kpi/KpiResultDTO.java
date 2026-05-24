package com.pms.dto.employee.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiResultDTO {
    private String kpiId;
    private String name;
    private Integer weightPercent;
    private KpiActualDTO actual;
    private KpiStandardDTO.KpiTargetDTO target;
    private Double achievementPercent;
    private Double score;
    private KpiSnapshotDTO latestSnapshot;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiActualDTO {
        private Double value;
        private String unit;
        private String displayText;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiSnapshotDTO {
        private String snapshotId;
        private Double value;
        private String note;
        private OffsetDateTime recordedAt;
    }
}

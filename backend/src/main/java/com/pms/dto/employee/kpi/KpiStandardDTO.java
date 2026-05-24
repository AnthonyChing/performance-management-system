package com.pms.dto.employee.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiStandardDTO {
    private String kpiId;
    private String name;
    private String description;
    private Integer weightPercent;
    private KpiTargetDTO target;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiTargetDTO {
        private String operator;
        private Double value;
        private String unit;
        private String displayText;
    }
}

package com.pms.dto.manager.kpi;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ManagerKpiPatchRequestDTO {
    private String title;
    private String description;
    private String kpiType;
    private String unit;
    private BigDecimal targetValue;
    private BigDecimal weight;
    private String targetOperator;
    private String targetUnit;
    private String targetDisplayText;
}

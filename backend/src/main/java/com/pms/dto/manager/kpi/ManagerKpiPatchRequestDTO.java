package com.pms.dto.manager.kpi;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class ManagerKpiPatchRequestDTO {
    private String title;
    private String description;
    private BigDecimal targetValue;
}

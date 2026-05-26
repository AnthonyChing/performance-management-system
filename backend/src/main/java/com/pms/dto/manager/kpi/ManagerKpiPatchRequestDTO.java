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
    private BigDecimal targetValue;
}

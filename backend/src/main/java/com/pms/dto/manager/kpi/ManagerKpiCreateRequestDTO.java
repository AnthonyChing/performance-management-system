package com.pms.dto.manager.kpi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class ManagerKpiCreateRequestDTO {
    @NotBlank
    private String title;
    private String description;
    private String kpiType;
    private String unit;
    @NotNull
    private BigDecimal targetValue;
}

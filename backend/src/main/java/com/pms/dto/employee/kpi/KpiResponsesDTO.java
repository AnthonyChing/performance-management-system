package com.pms.dto.employee.kpi;

import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.PaginationDTO;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class KpiResponsesDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiStandardsResponseDTO {
        private CycleSummaryDTO cycle;
        private KpiResultSummaryDTO.EmployeeSummaryDTO employee;
        private List<KpiStandardDTO> standards;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiResultResponseDTO {
        private KpiResultSummaryDTO result;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiConfirmationRequestDTO {
        @NotBlank(message = "Result ID is required")
        private String resultId;

        @NotNull(message = "Confirmed is required")
        @AssertTrue(message = "Confirmed must be true")
        private Boolean confirmed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiConfirmationResponseDTO {
        private KpiResultSummaryDTO.KpiConfirmationDTO confirmation;
        private KpiResultSummaryDTO result;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoricalKpiResultsResponseDTO {
        private String mode;
        private PaginationDTO pagination;
        private List<KpiResultSummaryDTO> results;
        private List<KpiStandardDTO> standards;
        private KpiResultSummaryDTO result;
    }
}

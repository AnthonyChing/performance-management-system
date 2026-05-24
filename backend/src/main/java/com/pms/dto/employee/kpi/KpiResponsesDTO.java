package com.pms.dto.employee.kpi;

import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.PaginationDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

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
        private String resultId;
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

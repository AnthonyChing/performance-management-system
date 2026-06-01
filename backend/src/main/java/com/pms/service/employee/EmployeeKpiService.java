package com.pms.service.employee;

import com.pms.dto.employee.kpi.KpiResponsesDTO.HistoricalKpiResultsResponseDTO;
import com.pms.dto.employee.kpi.KpiResponsesDTO.KpiConfirmationRequestDTO;
import com.pms.dto.employee.kpi.KpiResponsesDTO.KpiConfirmationResponseDTO;
import com.pms.dto.employee.kpi.KpiResponsesDTO.KpiResultResponseDTO;
import com.pms.dto.employee.kpi.KpiResponsesDTO.KpiStandardsResponseDTO;
import java.util.UUID;

public interface EmployeeKpiService {
    KpiStandardsResponseDTO getKpiStandards(UUID userId);

    KpiResultResponseDTO getKpiResult(UUID userId);

    KpiConfirmationResponseDTO confirmKpiResult(UUID userId, KpiConfirmationRequestDTO request);

    HistoricalKpiResultsResponseDTO getHistoricalKpiResults(
            UUID userId, Integer page, Integer pageSize, String q, String cycleId);
}

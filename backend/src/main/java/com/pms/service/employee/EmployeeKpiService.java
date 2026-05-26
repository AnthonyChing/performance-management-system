package com.pms.service.employee;

import com.pms.dto.employee.kpi.KpiResponsesDTO.*;

import java.util.UUID;

public interface EmployeeKpiService {
    KpiStandardsResponseDTO getKpiStandards(UUID userId);
    KpiResultResponseDTO getKpiResult(UUID userId);
    KpiConfirmationResponseDTO confirmKpiResult(UUID userId, KpiConfirmationRequestDTO request);
    HistoricalKpiResultsResponseDTO getHistoricalKpiResults(UUID userId, Integer page, Integer pageSize, String q, String cycleId);
}

package com.pms.service.employee;

import com.pms.dto.employee.kpi.KpiResponsesDTO.*;

public interface EmployeeKpiService {
    KpiStandardsResponseDTO getKpiStandards(String userId);
    KpiResultResponseDTO getKpiResult(String userId);
    KpiConfirmationResponseDTO confirmKpiResult(String userId, KpiConfirmationRequestDTO request);
    HistoricalKpiResultsResponseDTO getHistoricalKpiResults(String userId, Integer page, Integer pageSize, String q, String cycleId);
}

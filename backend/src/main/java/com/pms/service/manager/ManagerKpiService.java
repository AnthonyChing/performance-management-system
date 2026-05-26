package com.pms.service.manager;

import com.pms.dto.manager.kpi.ManagerKpiCreateRequestDTO;
import com.pms.dto.manager.kpi.ManagerKpiPatchRequestDTO;
import com.pms.dto.manager.kpi.ManagerKpiResponseDTO;
import java.util.List;
import java.util.UUID;

public interface ManagerKpiService {

    ManagerKpiResponseDTO createKpi(
            UUID managerId, UUID subordinateId, ManagerKpiCreateRequestDTO request);

    ManagerKpiResponseDTO patchKpi(
            UUID managerId, UUID subordinateId, UUID kpiId, ManagerKpiPatchRequestDTO request);

    List<ManagerKpiResponseDTO> listKpis(UUID managerId, UUID subordinateId, String cycleId);
}

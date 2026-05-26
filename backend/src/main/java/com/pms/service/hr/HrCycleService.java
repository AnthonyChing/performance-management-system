package com.pms.service.hr;

import com.pms.dto.hr.cycle.CycleCreateRequestDTO;
import com.pms.dto.hr.cycle.CyclePatchRequestDTO;
import com.pms.dto.hr.cycle.CyclePatchStatusRequestDTO;
import com.pms.dto.hr.cycle.CycleResponseDTO;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface HrCycleService {

    CycleResponseDTO createCycle(UUID actorId, CycleCreateRequestDTO request);

    Page<CycleResponseDTO> listCycles(String status, int page, int pageSize);

    CycleResponseDTO getCycle(UUID cycleId);

    CycleResponseDTO patchCycle(UUID actorId, UUID cycleId, CyclePatchRequestDTO request);

    CycleResponseDTO patchCycleStatus(UUID cycleId, CyclePatchStatusRequestDTO request);
}

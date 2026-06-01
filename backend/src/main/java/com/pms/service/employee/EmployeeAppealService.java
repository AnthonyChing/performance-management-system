package com.pms.service.employee;

import com.pms.dto.employee.appeal.AppealResponsesDTO.AppealResultResponseDTO;
import com.pms.dto.employee.appeal.AppealResponsesDTO.AppealSubmitRequestDTO;
import com.pms.dto.employee.appeal.AppealResponsesDTO.AppealSubmitResponseDTO;
import com.pms.dto.employee.appeal.AppealResponsesDTO.AppealsResponseDTO;
import java.util.UUID;

public interface EmployeeAppealService {
    AppealsResponseDTO getAppeals(UUID userId);

    AppealSubmitResponseDTO submitAppeal(UUID userId, AppealSubmitRequestDTO request);

    AppealResultResponseDTO getAppealResult(UUID userId);
}

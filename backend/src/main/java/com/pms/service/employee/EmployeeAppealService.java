package com.pms.service.employee;

import com.pms.dto.employee.appeal.AppealResponsesDTO.*;

public interface EmployeeAppealService {
    AppealsResponseDTO getAppeals(String userId);
    AppealSubmitResponseDTO submitAppeal(String userId, AppealSubmitRequestDTO request);
    AppealResultResponseDTO getAppealResult(String userId);
}

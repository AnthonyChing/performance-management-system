package com.pms.service.employee;

import com.pms.dto.employee.profile.CurrentCycleResponseDTO;
import com.pms.dto.employee.profile.ProfileResponseDTO;
import java.util.UUID;

public interface EmployeeProfileService {
    ProfileResponseDTO getProfile(UUID userId);

    CurrentCycleResponseDTO getCurrentCycle(UUID userId);
}

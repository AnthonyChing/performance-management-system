package com.pms.service.employee;

import com.pms.dto.employee.profile.CurrentCycleResponseDTO;
import com.pms.dto.employee.profile.ProfileResponseDTO;

public interface EmployeeProfileService {
    ProfileResponseDTO getProfile(String userId);
    CurrentCycleResponseDTO getCurrentCycle(String userId);
}

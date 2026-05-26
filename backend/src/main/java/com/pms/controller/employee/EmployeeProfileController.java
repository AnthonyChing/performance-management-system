package com.pms.controller.employee;

import com.pms.dto.employee.profile.CurrentCycleResponseDTO;
import com.pms.dto.employee.profile.ProfileResponseDTO;
import com.pms.security.SecurityUtils;
import com.pms.service.employee.EmployeeProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR')")
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> getProfile() {
        return ResponseEntity.ok(employeeProfileService.getProfile(SecurityUtils.currentUserId()));
    }

    @GetMapping("/performance-cycles/current")
    public ResponseEntity<CurrentCycleResponseDTO> getCurrentCycle() {
        return ResponseEntity.ok(employeeProfileService.getCurrentCycle(SecurityUtils.currentUserId()));
    }
}

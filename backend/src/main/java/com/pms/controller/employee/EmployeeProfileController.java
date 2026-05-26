package com.pms.controller.employee;

import com.pms.dto.employee.profile.CurrentCycleResponseDTO;
import com.pms.dto.employee.profile.ProfileResponseDTO;
import com.pms.service.employee.EmployeeProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;

    private UUID getCurrentUserId() {
        return UUID.fromString("00000000-0000-0000-0000-0000000000c1");
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> getProfile() {
        return ResponseEntity.ok(employeeProfileService.getProfile(getCurrentUserId()));
    }

    @GetMapping("/performance-cycles/current")
    public ResponseEntity<CurrentCycleResponseDTO> getCurrentCycle() {
        return ResponseEntity.ok(employeeProfileService.getCurrentCycle(getCurrentUserId()));
    }
}

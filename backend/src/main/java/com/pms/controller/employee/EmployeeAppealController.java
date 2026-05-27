package com.pms.controller.employee;

import com.pms.dto.employee.appeal.AppealResponsesDTO.*;
import com.pms.security.SecurityUtils;
import com.pms.service.employee.EmployeeAppealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me/appeals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR')")
public class EmployeeAppealController {

    private final EmployeeAppealService employeeAppealService;

    @GetMapping
    public ResponseEntity<AppealsResponseDTO> getAppeals() {
        return ResponseEntity.ok(employeeAppealService.getAppeals(SecurityUtils.currentUserId()));
    }

    @PostMapping("/submit")
    public ResponseEntity<AppealSubmitResponseDTO> submitAppeal(
            @Valid @RequestBody AppealSubmitRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeAppealService.submitAppeal(SecurityUtils.currentUserId(), request));
    }

    @GetMapping("/result")
    public ResponseEntity<AppealResultResponseDTO> getAppealResult() {
        return ResponseEntity.ok(
                employeeAppealService.getAppealResult(SecurityUtils.currentUserId()));
    }
}

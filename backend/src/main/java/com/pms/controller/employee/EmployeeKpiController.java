package com.pms.controller.employee;

import com.pms.dto.employee.kpi.KpiResponsesDTO.*;
import com.pms.security.SecurityUtils;
import com.pms.service.employee.EmployeeKpiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me/kpis")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR')")
public class EmployeeKpiController {

    private final EmployeeKpiService employeeKpiService;

    @GetMapping("/standards")
    public ResponseEntity<KpiStandardsResponseDTO> getKpiStandards() {
        return ResponseEntity.ok(employeeKpiService.getKpiStandards(SecurityUtils.currentUserId()));
    }

    @GetMapping("/result")
    public ResponseEntity<?> getKpiResult(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String cycleId) {

        if ("historical".equals(status)) {
            return ResponseEntity.ok(
                    employeeKpiService.getHistoricalKpiResults(
                            SecurityUtils.currentUserId(), page, pageSize, q, cycleId));
        }

        return ResponseEntity.ok(employeeKpiService.getKpiResult(SecurityUtils.currentUserId()));
    }

    @PostMapping("/result-confirmations")
    public ResponseEntity<KpiConfirmationResponseDTO> confirmKpiResult(
            @Valid @RequestBody KpiConfirmationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeKpiService.confirmKpiResult(SecurityUtils.currentUserId(), request));
    }
}

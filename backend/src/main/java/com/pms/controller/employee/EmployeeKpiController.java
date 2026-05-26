package com.pms.controller.employee;

import com.pms.dto.employee.kpi.KpiResponsesDTO.*;
import com.pms.service.employee.EmployeeKpiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/kpis")
@RequiredArgsConstructor
public class EmployeeKpiController {

    private final EmployeeKpiService employeeKpiService;

    private UUID getCurrentUserId() {
        return UUID.fromString("00000000-0000-0000-0000-0000000000c1");
    }

    @GetMapping("/standards")
    public ResponseEntity<KpiStandardsResponseDTO> getKpiStandards() {
        return ResponseEntity.ok(employeeKpiService.getKpiStandards(getCurrentUserId()));
    }

    @GetMapping("/result")
    public ResponseEntity<?> getKpiResult(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String cycleId) {

        if ("historical".equals(status)) {
            return ResponseEntity.ok(employeeKpiService.getHistoricalKpiResults(getCurrentUserId(), page, pageSize, q, cycleId));
        }

        return ResponseEntity.ok(employeeKpiService.getKpiResult(getCurrentUserId()));
    }

    @PostMapping("/result-confirmations")
    public ResponseEntity<KpiConfirmationResponseDTO> confirmKpiResult(
            @Valid @RequestBody KpiConfirmationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeKpiService.confirmKpiResult(getCurrentUserId(), request));
    }
}

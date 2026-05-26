package com.pms.controller.employee;

import com.pms.dto.employee.appeal.AppealResponsesDTO.*;
import com.pms.service.employee.EmployeeAppealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/appeals")
@RequiredArgsConstructor
public class EmployeeAppealController {

    private final EmployeeAppealService employeeAppealService;

    private UUID getCurrentUserId() {
        return UUID.fromString("00000000-0000-0000-0000-0000000000c1");
    }

    @GetMapping
    public ResponseEntity<AppealsResponseDTO> getAppeals() {
        return ResponseEntity.ok(employeeAppealService.getAppeals(getCurrentUserId()));
    }

    @PostMapping("/submit")
    public ResponseEntity<AppealSubmitResponseDTO> submitAppeal(
            @Valid @RequestBody AppealSubmitRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeAppealService.submitAppeal(getCurrentUserId(), request));
    }

    @GetMapping("/result")
    public ResponseEntity<AppealResultResponseDTO> getAppealResult() {
        return ResponseEntity.ok(employeeAppealService.getAppealResult(getCurrentUserId()));
    }
}

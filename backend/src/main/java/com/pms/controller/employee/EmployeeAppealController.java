package com.pms.controller.employee;

import com.pms.dto.employee.appeal.AppealResponsesDTO.*;
import com.pms.service.employee.EmployeeAppealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/appeals")
@RequiredArgsConstructor
public class EmployeeAppealController {

    private final EmployeeAppealService employeeAppealService;

    private String getCurrentUserId() {
        return "user_001";
    }

    @GetMapping
    public ResponseEntity<AppealsResponseDTO> getAppeals() {
        return ResponseEntity.ok(employeeAppealService.getAppeals(getCurrentUserId()));
    }

    @PostMapping("/submit")
    public ResponseEntity<AppealSubmitResponseDTO> submitAppeal(
            @RequestBody AppealSubmitRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeAppealService.submitAppeal(getCurrentUserId(), request));
    }

    @GetMapping("/result")
    public ResponseEntity<AppealResultResponseDTO> getAppealResult() {
        return ResponseEntity.ok(employeeAppealService.getAppealResult(getCurrentUserId()));
    }
}

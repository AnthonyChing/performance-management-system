package com.pms.controller.employee;

import com.pms.dto.employee.goal.*;
import com.pms.service.employee.EmployeeGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/goals")
@RequiredArgsConstructor
public class EmployeeGoalController {

    private final EmployeeGoalService employeeGoalService;

    private UUID getCurrentUserId() {
        return UUID.fromString("00000000-0000-0000-0000-0000000000c1");
    }

    @GetMapping
    public ResponseEntity<?> getGoals(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String cycleId) {

        if ("historical".equals(status)) {
            return ResponseEntity.ok(employeeGoalService.getHistoricalGoals(getCurrentUserId(), page, pageSize, q, cycleId));
        }

        return ResponseEntity.ok(employeeGoalService.getGoals(getCurrentUserId(), status, q));
    }

    @PostMapping
    public ResponseEntity<GoalCreationResponseDTO> createGoal(@Valid @RequestBody GoalRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeGoalService.createGoal(getCurrentUserId(), request));
    }

    @PostMapping("/{goalId}")
    public ResponseEntity<GoalCreationResponseDTO> updateGoal(
            @PathVariable String goalId,
            @Valid @RequestBody GoalRequestDTO request) {
        return ResponseEntity.ok(employeeGoalService.updateGoal(getCurrentUserId(), goalId, request));
    }

    @PostMapping("/{goalId}/progress-updates")
    public ResponseEntity<GoalProgressUpdateResponseDTO> updateGoalProgress(
            @PathVariable String goalId,
            @Valid @RequestBody GoalProgressUpdateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeGoalService.updateGoalProgress(getCurrentUserId(), goalId, request));
    }

    @GetMapping("/review-result")
    public ResponseEntity<GoalReviewResultResponseDTO> getGoalReviewResult(
            @RequestParam(required = false) String goalId) {
        return ResponseEntity.ok(employeeGoalService.getGoalReviewResult(getCurrentUserId(), goalId));
    }
}

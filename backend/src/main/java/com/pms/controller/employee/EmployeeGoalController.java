package com.pms.controller.employee;

import com.pms.dto.employee.goal.GoalCreationResponseDTO;
import com.pms.dto.employee.goal.GoalProgressUpdateRequestDTO;
import com.pms.dto.employee.goal.GoalProgressUpdateResponseDTO;
import com.pms.dto.employee.goal.GoalRequestDTO;
import com.pms.dto.employee.goal.GoalReviewResultResponseDTO;
import com.pms.security.SecurityUtils;
import com.pms.service.employee.EmployeeGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/goals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR')")
public class EmployeeGoalController {

    private final EmployeeGoalService employeeGoalService;

    @GetMapping
    public ResponseEntity<?> getGoals(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String cycleId) {

        if ("historical".equals(status)) {
            return ResponseEntity.ok(
                    employeeGoalService.getHistoricalGoals(
                            SecurityUtils.currentUserId(), page, pageSize, q, cycleId));
        }

        return ResponseEntity.ok(
                employeeGoalService.getGoals(SecurityUtils.currentUserId(), status, q));
    }

    @PostMapping
    public ResponseEntity<GoalCreationResponseDTO> createGoal(
            @Valid @RequestBody GoalRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeGoalService.createGoal(SecurityUtils.currentUserId(), request));
    }

    @PostMapping("/{goalId}")
    public ResponseEntity<GoalCreationResponseDTO> updateGoal(
            @PathVariable String goalId, @Valid @RequestBody GoalRequestDTO request) {
        return ResponseEntity.ok(
                employeeGoalService.updateGoal(SecurityUtils.currentUserId(), goalId, request));
    }

    @PostMapping("/{goalId}/progress-updates")
    public ResponseEntity<GoalProgressUpdateResponseDTO> updateGoalProgress(
            @PathVariable String goalId, @Valid @RequestBody GoalProgressUpdateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        employeeGoalService.updateGoalProgress(
                                SecurityUtils.currentUserId(), goalId, request));
    }

    @GetMapping("/review-result")
    public ResponseEntity<GoalReviewResultResponseDTO> getGoalReviewResult(
            @RequestParam(required = false) String goalId) {
        return ResponseEntity.ok(
                employeeGoalService.getGoalReviewResult(SecurityUtils.currentUserId(), goalId));
    }
}

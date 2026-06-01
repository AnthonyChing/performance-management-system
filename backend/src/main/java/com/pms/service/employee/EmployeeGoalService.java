package com.pms.service.employee;

import com.pms.dto.employee.goal.GoalCreationResponseDTO;
import com.pms.dto.employee.goal.GoalProgressUpdateRequestDTO;
import com.pms.dto.employee.goal.GoalProgressUpdateResponseDTO;
import com.pms.dto.employee.goal.GoalRequestDTO;
import com.pms.dto.employee.goal.GoalReviewResultResponseDTO;
import com.pms.dto.employee.goal.GoalsResponseDTO;
import com.pms.dto.employee.goal.HistoricalGoalsResponseDTO;
import java.util.UUID;

public interface EmployeeGoalService {
    GoalsResponseDTO getGoals(UUID userId, String status, String q);

    HistoricalGoalsResponseDTO getHistoricalGoals(
            UUID userId, Integer page, Integer pageSize, String q, String cycleId);

    GoalCreationResponseDTO createGoal(UUID userId, GoalRequestDTO request);

    GoalCreationResponseDTO updateGoal(UUID userId, String goalId, GoalRequestDTO request);

    GoalProgressUpdateResponseDTO updateGoalProgress(
            UUID userId, String goalId, GoalProgressUpdateRequestDTO request);

    GoalReviewResultResponseDTO getGoalReviewResult(UUID userId, String goalId);
}

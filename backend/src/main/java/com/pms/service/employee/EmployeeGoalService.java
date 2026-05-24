package com.pms.service.employee;

import com.pms.dto.employee.goal.*;

public interface EmployeeGoalService {
    GoalsResponseDTO getGoals(String userId, String status, String q);
    HistoricalGoalsResponseDTO getHistoricalGoals(String userId, Integer page, Integer pageSize, String q, String cycleId);
    GoalCreationResponseDTO createGoal(String userId, GoalRequestDTO request);
    GoalCreationResponseDTO updateGoal(String userId, String goalId, GoalRequestDTO request);
    GoalProgressUpdateResponseDTO updateGoalProgress(String userId, String goalId, GoalProgressUpdateRequestDTO request);
    GoalReviewResultResponseDTO getGoalReviewResult(String userId, String goalId);
}

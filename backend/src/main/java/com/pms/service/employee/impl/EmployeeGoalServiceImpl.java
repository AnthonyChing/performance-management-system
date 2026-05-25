package com.pms.service.employee.impl;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.ManagerDTO;
import com.pms.dto.employee.PaginationDTO;
import com.pms.dto.employee.goal.*;
import com.pms.service.employee.EmployeeGoalService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class EmployeeGoalServiceImpl implements EmployeeGoalService {

    @Override
    public GoalsResponseDTO getGoals(String userId, String status, String q) {
        GoalSummaryDTO summary = GoalSummaryDTO.builder()
                .totalCount(5)
                .pendingReviewCount(1)
                .inProgressCount(2)
                .revisionRequestedCount(1)
                .completedCount(1)
                .cancelledCount(0)
                .build();

        GoalDTO goal = buildMockGoal();

        CycleSummaryDTO cycle = CycleSummaryDTO.builder()
                .cycleId("cycle_2026_q3")
                .name("2026 Q3")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 9, 30))
                .timezone("Asia/Taipei")
                .status("active")
                .isReviewLocked(false)
                .build();

        return GoalsResponseDTO.builder()
                .cycle(cycle)
                .availableActions(AvailableActionsDTO.builder().canCreateGoal(true).build())
                .summary(summary)
                .goals(List.of(goal))
                .build();
    }

    @Override
    public HistoricalGoalsResponseDTO getHistoricalGoals(String userId, Integer page, Integer pageSize, String q, String cycleId) {
        if (cycleId == null) {
            CycleSummaryDTO cycle = CycleSummaryDTO.builder()
                    .cycleId("cycle_2023_q4")
                    .name("2023 第四季度 (Q4) 年度終考")
                    .periodLabel("2023 第四季度 (Q4)")
                    .reviewType("年度終考")
                    .startDate(LocalDate.of(2023, 10, 1))
                    .endDate(LocalDate.of(2023, 12, 31))
                    .timezone("Asia/Taipei")
                    .averageCompletionPercent(94.5)
                    .goalCount(10)
                    .build();

            return HistoricalGoalsResponseDTO.builder()
                    .mode("historical_cycles")
                    .pagination(PaginationDTO.builder().page(1).pageSize(4).totalPages(5).totalCount(20).hasPrevious(false).hasNext(true).build())
                    .historicalCycles(List.of(cycle))
                    .build();
        } else {
            CycleSummaryDTO cycle = CycleSummaryDTO.builder()
                    .cycleId("cycle_2025_annual")
                    .name("2025年度考核")
                    .startDate(LocalDate.of(2025, 1, 1))
                    .endDate(LocalDate.of(2025, 12, 31))
                    .timezone("Asia/Taipei")
                    .status("completed")
                    .build();

            GoalDTO goal = buildMockGoal();
            goal.setGoalId("goal_h_001");
            goal.setStatus("completed");

            return HistoricalGoalsResponseDTO.builder()
                    .mode("historical_goals")
                    .cycle(cycle)
                    .pagination(PaginationDTO.builder().page(1).pageSize(10).totalPages(1).totalCount(1).hasPrevious(false).hasNext(false).build())
                    .summary(GoalSummaryDTO.builder().averageCompletionPercent(75.0).goalCount(1).completedCount(1).cancelledCount(0).build())
                    .goals(List.of(goal))
                    .build();
        }
    }

    @Override
    public GoalCreationResponseDTO createGoal(String userId, GoalRequestDTO request) {
        GoalDTO goal = buildMockGoal();
        goal.setGoalId("goal_002");
        goal.setTitle(request.getTitle());
        goal.setDescription(request.getDescription());
        goal.setDueDate(request.getDueDate());
        goal.setStatus("pending_review");
        goal.setProgressPercent(0);
        goal.setLatestProgressUpdate(null);
        goal.setLatestReview(null);
        goal.setPublishedAt(null);

        return GoalCreationResponseDTO.builder().goal(goal).build();
    }

    @Override
    public GoalCreationResponseDTO updateGoal(String userId, String goalId, GoalRequestDTO request) {
        GoalDTO goal = buildMockGoal();
        goal.setGoalId(goalId);
        goal.setTitle(request.getTitle());
        goal.setDescription(request.getDescription());
        goal.setDueDate(request.getDueDate());
        goal.setStatus("pending_review");
        
        return GoalCreationResponseDTO.builder().goal(goal).build();
    }

    @Override
    public GoalProgressUpdateResponseDTO updateGoalProgress(String userId, String goalId, GoalProgressUpdateRequestDTO request) {
        GoalProgressUpdateDTO update = GoalProgressUpdateDTO.builder()
                .progressUpdateId("progress_002")
                .goalId(goalId)
                .progressPercent(request.getProgressPercent())
                .note(request.getNote())
                .createdAt(OffsetDateTime.now())
                .createdBy(GoalProgressUpdateDTO.ProgressUpdateCreatorDTO.builder().userId(userId).name("Alex Chen").build())
                .build();

        GoalProgressUpdateDTO latestUpdate = GoalProgressUpdateDTO.builder()
                .progressUpdateId(update.getProgressUpdateId())
                .progressPercent(update.getProgressPercent())
                .note(update.getNote())
                .createdAt(update.getCreatedAt())
                .createdBy(update.getCreatedBy())
                .build();

        GoalDTO goal = buildMockGoal();
        goal.setGoalId(goalId);
        goal.setProgressPercent(request.getProgressPercent());
        goal.setLatestProgressUpdate(latestUpdate);

        return GoalProgressUpdateResponseDTO.builder().progressUpdate(update).goal(goal).build();
    }

    @Override
    public GoalReviewResultResponseDTO getGoalReviewResult(String userId, String goalId) {
        CycleSummaryDTO cycle = CycleSummaryDTO.builder()
                .cycleId("cycle_2026_q3")
                .name("2026 Q3")
                .status("active")
                .isReviewLocked(false)
                .build();

        GoalReviewResultDTO result = GoalReviewResultDTO.builder()
                .goalId(goalId != null ? goalId : "goal_001")
                .title("提升 Q3 季度客戶滿意度至 92%")
                .status("in_progress")
                .decision("approved")
                .comment("目前進度非常理想。")
                .reviewedAt(OffsetDateTime.of(2026, 8, 10, 15, 0, 0, 0, ZoneOffset.ofHours(8)))
                .reviewer(buildManager())
                .build();

        return GoalReviewResultResponseDTO.builder()
                .cycle(cycle)
                .overallStatus("in_progress")
                .summary(GoalSummaryDTO.builder().totalCount(3).pendingReviewCount(0).inProgressCount(2).revisionRequestedCount(1).build())
                .reviewedAt(OffsetDateTime.of(2026, 8, 10, 15, 0, 0, 0, ZoneOffset.ofHours(8)))
                .reviewer(buildManager())
                .results(List.of(result))
                .build();
    }

    private ManagerDTO buildManager() {
        return ManagerDTO.builder()
                .userId("user_100")
                .name("李曉芳")
                .title("Director")
                .build();
    }

    private GoalDTO buildMockGoal() {
        return GoalDTO.builder()
                .goalId("goal_001")
                .cycleId("cycle_2026_q3")
                .goalType("individual")
                .title("提升 Q3 季度客戶滿意度至 92%")
                .description("透過優化售後服務流程及縮短工單處理時間，計畫在第三季度將 CSAT 分數從 88% 提升至 92%。")
                .dueDate(LocalDate.of(2026, 9, 30))
                .status("in_progress")
                .progressPercent(75)
                .owner(GoalDTO.GoalOwnerDTO.builder().userId("user_001").name("Alex Chen").department("System Management").build())
                .reviewer(buildManager())
                .latestProgressUpdate(GoalProgressUpdateDTO.builder()
                        .progressUpdateId("progress_001")
                        .progressPercent(75)
                        .note("初步數據顯示滿意度已有回升。")
                        .createdAt(OffsetDateTime.of(2026, 8, 15, 10, 20, 0, 0, ZoneOffset.ofHours(8)))
                        .createdBy(GoalProgressUpdateDTO.ProgressUpdateCreatorDTO.builder().userId("user_001").name("Alex Chen").build())
                        .build())
                .latestReview(GoalReviewDTO.builder()
                        .reviewId("goal_review_001")
                        .decision("approved")
                        .comment("目前進度非常理想。")
                        .reviewedAt(OffsetDateTime.of(2026, 8, 10, 15, 0, 0, 0, ZoneOffset.ofHours(8)))
                        .reviewer(buildManager())
                        .build())
                .availableActions(AvailableActionsDTO.builder().canEdit(false).editUnavailableReason("invalid_goal_status").canUpdateProgress(true).build())
                .publishedAt(OffsetDateTime.of(2026, 8, 10, 15, 0, 0, 0, ZoneOffset.ofHours(8)))
                .createdAt(OffsetDateTime.of(2026, 5, 20, 9, 0, 0, 0, ZoneOffset.ofHours(8)))
                .updatedAt(OffsetDateTime.of(2026, 8, 15, 10, 20, 0, 0, ZoneOffset.ofHours(8)))
                .build();
    }
}

package com.pms.service.employee.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.pms.dto.employee.goal.*;
import com.pms.entity.*;
import com.pms.entity.enums.*;
import com.pms.exception.ConflictException;
import com.pms.repository.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class EmployeeGoalServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private PerformanceCycleRepository performanceCycleRepository;
    @Mock private GoalRepository goalRepository;
    @Mock private GoalProgressUpdateRepository goalProgressUpdateRepository;
    @Mock private GoalReviewRepository goalReviewRepository;

    @InjectMocks private EmployeeGoalServiceImpl goalService;

    private UUID userId;
    private UUID managerId;
    private UUID cycleId;
    private PerformanceCycle activeCycle;
    private User testUser;
    private User managerUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        managerId = UUID.randomUUID();
        cycleId = UUID.randomUUID();

        activeCycle =
                PerformanceCycle.builder()
                        .id(cycleId)
                        .name("2024 Q1")
                        .status(CycleStatus.IN_PROGRESS)
                        .isLocked(false)
                        .cycleStart(OffsetDateTime.now(ZoneOffset.UTC).minusDays(10))
                        .hrReviewEnd(OffsetDateTime.now(ZoneOffset.UTC).plusDays(10))
                        .build();

        testUser =
                User.builder()
                        .id(userId)
                        .managerId(managerId)
                        .fullName("Test User")
                        .departmentId(UUID.randomUUID())
                        .build();

        managerUser = User.builder().id(managerId).fullName("Test Manager").build();
    }

    private void mockCurrentCycle() {
        when(performanceCycleRepository.findByStatusIn(anyList())).thenReturn(List.of(activeCycle));
    }

    @Test
    void getGoals_success() {
        mockCurrentCycle();
        Goal goal =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.PENDING_REVIEW)
                        .progressPercent(0)
                        .title("Test Goal")
                        .build();

        when(goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycleId, userId))
                .thenReturn(List.of(goal));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(managerId)).thenReturn(Optional.of(managerUser));
        when(goalProgressUpdateRepository.findLatestByGoalIds(anyList()))
                .thenReturn(Collections.emptyList());
        when(goalReviewRepository.findLatestByGoalIds(anyList()))
                .thenReturn(Collections.emptyList());
        when(departmentRepository.findById(any())).thenReturn(Optional.of(new Department()));

        GoalsResponseDTO response = goalService.getGoals(userId, "pending_review", "test");

        assertNotNull(response);
        assertEquals(1, response.getGoals().size());
        assertEquals("Test Goal", response.getGoals().get(0).getTitle());
    }

    @Test
    void getHistoricalGoals_withoutCycleId() {
        PerformanceCycle closedCycle =
                PerformanceCycle.builder()
                        .id(UUID.randomUUID())
                        .status(CycleStatus.COMPLETED)
                        .build();
        Page<PerformanceCycle> cyclePage = new PageImpl<>(List.of(closedCycle));

        when(performanceCycleRepository.findByStatusInOrderByHrReviewEndDesc(
                        anyList(), any(PageRequest.class)))
                .thenReturn(cyclePage);
        when(goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(closedCycle.getId(), userId))
                .thenReturn(Collections.emptyList());

        HistoricalGoalsResponseDTO response =
                goalService.getHistoricalGoals(userId, 1, 10, null, null);

        assertNotNull(response);
        assertEquals("historical_cycles", response.getMode());
        assertEquals(1, response.getHistoricalCycles().size());
    }

    @Test
    void getHistoricalGoals_withCycleId() {
        PerformanceCycle closedCycle =
                PerformanceCycle.builder().id(cycleId).status(CycleStatus.COMPLETED).build();
        when(performanceCycleRepository.findById(cycleId)).thenReturn(Optional.of(closedCycle));

        Goal goal =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.COMPLETED)
                        .progressPercent(100)
                        .title("Old Goal")
                        .build();

        when(goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycleId, userId))
                .thenReturn(List.of(goal));

        HistoricalGoalsResponseDTO response =
                goalService.getHistoricalGoals(userId, 1, 10, "old", cycleId.toString());

        assertNotNull(response);
        assertEquals("historical_goals", response.getMode());
        assertEquals(1, response.getGoals().size());
    }

    @Test
    void createGoal_success() {
        mockCurrentCycle();
        GoalRequestDTO req = new GoalRequestDTO();
        req.setTitle("New Goal");
        req.setDescription("Desc");
        req.setDueDate(LocalDate.now().plusDays(5));

        when(goalRepository.save(any(Goal.class)))
                .thenAnswer(
                        i -> {
                            Goal g = i.getArgument(0);
                            g.setId(UUID.randomUUID());
                            return g;
                        });

        GoalCreationResponseDTO response = goalService.createGoal(userId, req);

        assertNotNull(response);
        assertEquals("New Goal", response.getGoal().getTitle());
        assertEquals(GoalStatus.PENDING_REVIEW.getDbValue(), response.getGoal().getStatus());
    }

    @Test
    void updateGoal_success() {
        UUID goalId = UUID.randomUUID();
        Goal goal =
                Goal.builder()
                        .id(goalId)
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.REVISION_REQUESTED)
                        .build();

        when(goalRepository.findById(goalId)).thenReturn(Optional.of(goal));
        when(performanceCycleRepository.findById(cycleId)).thenReturn(Optional.of(activeCycle));
        when(goalRepository.save(any(Goal.class))).thenReturn(goal);

        GoalRequestDTO req = new GoalRequestDTO();
        req.setTitle("Updated Goal");
        req.setDueDate(LocalDate.now().plusDays(5));

        GoalCreationResponseDTO response = goalService.updateGoal(userId, goalId.toString(), req);

        assertNotNull(response);
        assertEquals(GoalStatus.PENDING_REVIEW.getDbValue(), response.getGoal().getStatus());
    }

    @Test
    void updateGoalProgress_success() {
        UUID goalId = UUID.randomUUID();
        Goal goal =
                Goal.builder()
                        .id(goalId)
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.IN_PROGRESS)
                        .build();

        when(goalRepository.findById(goalId)).thenReturn(Optional.of(goal));
        when(performanceCycleRepository.findById(cycleId)).thenReturn(Optional.of(activeCycle));

        GoalProgressUpdate update =
                GoalProgressUpdate.builder()
                        .id(UUID.randomUUID())
                        .progressPercent(50)
                        .updatedBy(userId)
                        .build();
        when(goalProgressUpdateRepository.save(any(GoalProgressUpdate.class))).thenReturn(update);
        when(goalRepository.save(any(Goal.class))).thenReturn(goal);

        GoalProgressUpdateRequestDTO req = new GoalProgressUpdateRequestDTO();
        req.setProgressPercent(100);

        GoalProgressUpdateResponseDTO response =
                goalService.updateGoalProgress(userId, goalId.toString(), req);

        assertNotNull(response);
        assertEquals(100, response.getGoal().getProgressPercent());
        assertEquals(GoalStatus.COMPLETED.getDbValue(), response.getGoal().getStatus());
    }

    @Test
    void getGoalReviewResult_success() {
        mockCurrentCycle();
        Goal goal =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.COMPLETED)
                        .build();

        when(goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycleId, userId))
                .thenReturn(List.of(goal));

        GoalReview review =
                GoalReview.builder()
                        .id(UUID.randomUUID())
                        .goalId(goal.getId())
                        .decision(GoalReviewDecision.APPROVED)
                        .reviewedBy(managerId)
                        .reviewedAt(OffsetDateTime.now())
                        .build();

        when(goalReviewRepository.findLatestByGoalIds(anyList())).thenReturn(List.of(review));
        when(userRepository.findById(managerId)).thenReturn(Optional.of(managerUser));

        GoalReviewResultResponseDTO response = goalService.getGoalReviewResult(userId, null);

        assertNotNull(response);
        assertEquals(1, response.getResults().size());
        assertEquals(
                GoalReviewDecision.APPROVED.getDbValue(),
                response.getResults().get(0).getDecision());
    }

    @Test
    void getGoals_withSearchQuery() {
        mockCurrentCycle();
        Goal goal1 =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.PENDING_REVIEW)
                        .title("Find this target")
                        .build();
        Goal goal2 =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.PENDING_REVIEW)
                        .title("Ignore this")
                        .build();

        when(goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycleId, userId))
                .thenReturn(List.of(goal1, goal2));

        GoalsResponseDTO response = goalService.getGoals(userId, null, "target");

        assertNotNull(response);
        assertEquals(1, response.getGoals().size());
        assertEquals("Find this target", response.getGoals().get(0).getTitle());
    }

    @Test
    void getGoals_invalidStatus() {
        mockCurrentCycle();
        assertThrows(
                ConflictException.class,
                () -> goalService.getGoals(userId, "invalid_status_string", null));
    }

    @Test
    void createGoal_lockedCycle() {
        PerformanceCycle lockedCycle =
                PerformanceCycle.builder()
                        .id(cycleId)
                        .status(CycleStatus.IN_PROGRESS)
                        .isLocked(true)
                        .cycleStart(OffsetDateTime.now().minusDays(10))
                        .hrReviewEnd(OffsetDateTime.now().plusDays(10))
                        .build();
        when(performanceCycleRepository.findByStatusIn(anyList())).thenReturn(List.of(lockedCycle));

        GoalRequestDTO req = new GoalRequestDTO();
        assertThrows(ConflictException.class, () -> goalService.createGoal(userId, req));
    }

    @Test
    void computeOverallStatus_variousCombinations() {
        mockCurrentCycle();
        Goal goal1 =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycleId)
                        .ownerId(userId)
                        .status(GoalStatus.IN_PROGRESS)
                        .build();
        when(goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycleId, userId))
                .thenReturn(List.of(goal1));
        when(goalReviewRepository.findLatestByGoalIds(anyList()))
                .thenReturn(Collections.emptyList());

        GoalReviewResultResponseDTO response = goalService.getGoalReviewResult(userId, null);
        assertEquals("in_progress", response.getOverallStatus());
    }
}

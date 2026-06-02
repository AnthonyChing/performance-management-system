package com.pms.service.manager.impl;

import com.pms.audit.Auditable;
import com.pms.dto.manager.goal.ManagerGoalCreateRequestDTO;
import com.pms.dto.manager.goal.ManagerGoalPatchRequestDTO;
import com.pms.dto.manager.goal.ManagerGoalResponseDTO;
import com.pms.entity.Goal;
import com.pms.entity.PerformanceCycle;
import com.pms.entity.User;
import com.pms.entity.enums.CycleStatus;
import com.pms.entity.enums.GoalStatus;
import com.pms.entity.enums.GoalType;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.entity.GoalReview;
import com.pms.entity.enums.GoalReviewDecision;
import com.pms.repository.GoalRepository;
import com.pms.repository.GoalReviewRepository;
import com.pms.repository.PerformanceCycleRepository;
import com.pms.repository.UserRepository;
import com.pms.service.manager.ManagerGoalService;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerGoalServiceImpl implements ManagerGoalService {

    private final GoalRepository goalRepo;
    private final UserRepository userRepo;
    private final PerformanceCycleRepository cycleRepo;
    private final GoalReviewRepository goalReviewRepo;

    @Override
    @Transactional
    @Auditable(
            action = "CREATE_GOAL_FOR_SUBORDINATE",
            resource = "goal",
            resourceIdFrom = "return.goalId")
    public ManagerGoalResponseDTO createGoal(
            UUID managerId, UUID subordinateId, ManagerGoalCreateRequestDTO req) {
        User subordinate = assertDirectSubordinate(managerId, subordinateId);
        PerformanceCycle cycle = getCurrentCycle();
        assertNotLocked(cycle);

        if (req.getDueDate() != null
                && req.getDueDate().isAfter(cycle.getHrReviewEnd().toLocalDate())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Due date must be within the active performance cycle");
        }

        GoalType type =
                req.getGoalType() != null ? parseGoalType(req.getGoalType()) : GoalType.INDIVIDUAL;
        Goal goal =
                Goal.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycle.getId())
                        .ownerId(subordinateId)
                        .setBy(managerId)
                        .goalType(type)
                        .title(req.getTitle())
                        .description(req.getDescription())
                        .dueDate(req.getDueDate())
                        .status(GoalStatus.PENDING_REVIEW)
                        .progressPercent(0)
                        .build();
        return ManagerGoalResponseDTO.from(goalRepo.save(goal));
    }

    @Override
    @Transactional
    @Auditable(action = "REVIEW_GOAL", resource = "goal", resourceIdFrom = "goalId")
    public ManagerGoalResponseDTO patchGoal(
            UUID managerId, UUID subordinateId, UUID goalId, ManagerGoalPatchRequestDTO req) {
        assertDirectSubordinate(managerId, subordinateId);
        Goal goal =
                goalRepo.findByIdAndDeletedAtIsNull(goalId)
                        .filter(g -> g.getOwnerId().equals(subordinateId))
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Goal not found"));
        PerformanceCycle cycle =
                cycleRepo
                        .findById(goal.getCycleId())
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Cycle not found"));
        assertNotLocked(cycle);

        GoalStatus previousStatus = goal.getStatus();
        if (req.getStatus() != null) {
            goal.setStatus(parseGoalStatus(req.getStatus()));
        }
        if (req.getTitle() != null) {
            goal.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            goal.setDescription(req.getDescription());
        }
        if (req.getDueDate() != null) {
            goal.setDueDate(req.getDueDate());
        }
        if (goal.getStatus() == GoalStatus.IN_PROGRESS && goal.getPublishedAt() == null) {
            goal.setPublishedAt(OffsetDateTime.now());
        }

        ManagerGoalResponseDTO result = ManagerGoalResponseDTO.from(goalRepo.save(goal));

        Set<GoalStatus> reviewableTransitions = Set.of(GoalStatus.IN_PROGRESS, GoalStatus.REVISION_REQUESTED);
        if (goal.getStatus() != previousStatus && reviewableTransitions.contains(goal.getStatus())) {
            GoalReviewDecision decision = goal.getStatus() == GoalStatus.REVISION_REQUESTED
                    ? GoalReviewDecision.REVISION_REQUESTED
                    : GoalReviewDecision.APPROVED;
            goalReviewRepo.save(GoalReview.builder()
                    .id(UUID.randomUUID())
                    .goalId(goal.getId())
                    .decision(decision)
                    .comment(req.getManagerComment())
                    .reviewedBy(managerId)
                    .reviewedAt(OffsetDateTime.now())
                    .build());
        }

        return result;
    }

    @Override
    public List<ManagerGoalResponseDTO> listGoals(
            UUID managerId, UUID subordinateId, String cycleId, String status) {
        assertDirectSubordinate(managerId, subordinateId);
        List<Goal> goals;
        if (cycleId != null) {
            UUID cid = UUID.fromString(cycleId);
            goals = goalRepo.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cid, subordinateId);
        } else {
            PerformanceCycle cycle = getCurrentCycle();
            goals =
                    goalRepo.findByCycleIdAndOwnerIdAndDeletedAtIsNull(
                            cycle.getId(), subordinateId);
        }
        if (status != null) {
            GoalStatus s = parseGoalStatus(status);
            goals = goals.stream().filter(g -> g.getStatus() == s).toList();
        }
        return goals.stream().map(ManagerGoalResponseDTO::from).toList();
    }

    @Override
    public List<ManagerGoalResponseDTO> listAllSubordinateGoals(
            UUID managerId, String cycleId, String status) {
        List<User> subordinates = userRepo.findByManagerId(managerId);
        List<UUID> subordinateIds = subordinates.stream().map(User::getId).toList();

        if (subordinateIds.isEmpty()) {
            return List.of();
        }

        List<Goal> goals;
        if (cycleId != null) {
            UUID cid = UUID.fromString(cycleId);
            goals = goalRepo.findByCycleIdAndOwnerIdInAndDeletedAtIsNull(cid, subordinateIds);
        } else {
            PerformanceCycle cycle = getCurrentCycle();
            goals =
                    goalRepo.findByCycleIdAndOwnerIdInAndDeletedAtIsNull(
                            cycle.getId(), subordinateIds);
        }

        if (status != null) {
            GoalStatus s = parseGoalStatus(status);
            goals = goals.stream().filter(g -> g.getStatus() == s).toList();
        }
        return goals.stream().map(ManagerGoalResponseDTO::from).toList();
    }

    private User assertDirectSubordinate(UUID managerId, UUID subordinateId) {
        User sub =
                userRepo.findById(subordinateId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "SUBORDINATE_NOT_FOUND", "Employee not found"));
        if (!managerId.equals(sub.getManagerId())) {
            throw new ForbiddenException("FORBIDDEN", "You do not manage this employee");
        }
        return sub;
    }

    private PerformanceCycle getCurrentCycle() {
        List<CycleStatus> active =
                List.of(
                        CycleStatus.NOT_STARTED,
                        CycleStatus.IN_PROGRESS,
                        CycleStatus.LOCKED,
                        CycleStatus.RESULTS_PUBLISHED,
                        CycleStatus.COMPLETED);
        return cycleRepo.findByStatusIn(active).stream()
                .min(Comparator.comparingInt(c -> statusPriority(c.getStatus())))
                .orElseThrow(
                        () ->
                                new NotFoundException(
                                        "CYCLE_NOT_FOUND", "No active performance cycle"));
    }

    private void assertNotLocked(PerformanceCycle cycle) {
        if (Boolean.TRUE.equals(cycle.getIsLocked())) {
            throw new ConflictException("STATE_CONFLICT", "Performance cycle is locked");
        }
    }

    private GoalType parseGoalType(String value) {
        try {
            return GoalType.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid goal_type: " + value);
        }
    }

    private GoalStatus parseGoalStatus(String value) {
        try {
            return GoalStatus.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid status: " + value);
        }
    }

    private int statusPriority(CycleStatus s) {
        return switch (s) {
            case IN_PROGRESS -> 1;
            case LOCKED -> 2;
            case RESULTS_PUBLISHED -> 3;
            case COMPLETED -> 4;
            case NOT_STARTED -> 5;
            default -> 99;
        };
    }
}

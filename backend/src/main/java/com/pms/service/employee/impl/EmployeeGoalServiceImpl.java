package com.pms.service.employee.impl;

import com.pms.audit.Auditable;
import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.ManagerDTO;
import com.pms.dto.employee.PaginationDTO;
import com.pms.dto.employee.goal.*;
import com.pms.entity.*;
import com.pms.entity.enums.CycleStatus;
import com.pms.entity.enums.GoalStatus;
import com.pms.entity.enums.GoalType;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.*;
import com.pms.service.employee.EmployeeGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeGoalServiceImpl implements EmployeeGoalService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PerformanceCycleRepository performanceCycleRepository;
    private final GoalRepository goalRepository;
    private final GoalProgressUpdateRepository goalProgressUpdateRepository;
    private final GoalReviewRepository goalReviewRepository;

    @Override
    public GoalsResponseDTO getGoals(UUID userId, String status, String q) {
        PerformanceCycle cycle = getCurrentCycleOptional()
                .orElseThrow(() -> new NotFoundException("CYCLE_NOT_FOUND", "No current performance cycle found"));

        GoalStatus statusFilter = null;
        if (status != null && !status.isBlank()) {
            try {
                statusFilter = GoalStatus.fromDbValue(status);
            } catch (IllegalArgumentException e) {
                throw new ConflictException("INVALID_STATUS", "Invalid goal status: " + status);
            }
        }

        List<Goal> goals = goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycle.getId(), userId);

        final GoalStatus finalStatusFilter = statusFilter;
        if (finalStatusFilter != null) {
            goals = goals.stream().filter(g -> g.getStatus() == finalStatusFilter).collect(Collectors.toList());
        }
        if (q != null && !q.isBlank()) {
            String lq = q.toLowerCase();
            goals = goals.stream()
                    .filter(g -> (g.getTitle() != null && g.getTitle().toLowerCase().contains(lq))
                            || (g.getDescription() != null && g.getDescription().toLowerCase().contains(lq)))
                    .collect(Collectors.toList());
        }

        List<UUID> goalIds = goals.stream().map(Goal::getId).collect(Collectors.toList());

        Map<UUID, GoalProgressUpdate> latestProgressMap = Collections.emptyMap();
        Map<UUID, GoalReview> latestReviewMap = Collections.emptyMap();
        if (!goalIds.isEmpty()) {
            latestProgressMap = goalProgressUpdateRepository.findLatestByGoalIds(goalIds).stream()
                    .collect(Collectors.toMap(GoalProgressUpdate::getGoalId, Function.identity()));
            latestReviewMap = goalReviewRepository.findLatestByGoalIds(goalIds).stream()
                    .collect(Collectors.toMap(GoalReview::getGoalId, Function.identity()));
        }

        User owner = userRepository.findById(userId).orElse(null);
        User manager = (owner != null && owner.getManagerId() != null)
                ? userRepository.findById(owner.getManagerId()).orElse(null)
                : null;

        List<GoalDTO> goalDTOs = new ArrayList<>();
        for (Goal goal : goals) {
            GoalProgressUpdate latestProgress = latestProgressMap.get(goal.getId());
            GoalReview latestReview = latestReviewMap.get(goal.getId());
            goalDTOs.add(buildGoalDTO(goal, owner, manager, latestProgress, latestReview, cycle));
        }

        // All goals (unfiltered) for summary count
        List<Goal> allGoals = goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycle.getId(), userId);
        GoalSummaryDTO summary = buildSummary(allGoals);

        CycleSummaryDTO cycleDTO = buildCycleSummaryDTO(cycle);

        return GoalsResponseDTO.builder()
                .cycle(cycleDTO)
                .availableActions(AvailableActionsDTO.builder()
                        .canCreateGoal(!cycle.getIsLocked())
                        .build())
                .summary(summary)
                .goals(goalDTOs)
                .build();
    }

    @Override
    public HistoricalGoalsResponseDTO getHistoricalGoals(UUID userId, Integer page, Integer pageSize, String q, String cycleId) {
        if (cycleId == null) {
            List<CycleStatus> historicalStatuses = List.of(CycleStatus.COMPLETED, CycleStatus.CLOSED);
            int pageIndex = (page != null && page > 0) ? page - 1 : 0;
            int size = (pageSize != null && pageSize > 0) ? pageSize : 10;
            Page<PerformanceCycle> cyclePage = performanceCycleRepository.findByStatusInOrderByHrReviewEndDesc(
                    historicalStatuses, PageRequest.of(pageIndex, size));

            List<CycleSummaryDTO> historicalCycles = new ArrayList<>();
            for (PerformanceCycle c : cyclePage.getContent()) {
                List<Goal> cGoals = goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(c.getId(), userId);
                int count = cGoals.size();
                double avgCompletion = cGoals.isEmpty() ? 0.0
                        : cGoals.stream().mapToInt(Goal::getProgressPercent).average().orElse(0.0);

                LocalDate startDate = c.getSelfEvalStart() != null ? c.getSelfEvalStart().toLocalDate() : null;
                LocalDate endDate = c.getHrReviewEnd() != null ? c.getHrReviewEnd().toLocalDate() : null;
                String periodLabel = (startDate != null && endDate != null) ? startDate + "~" + endDate : null;

                CycleSummaryDTO cs = buildCycleSummaryDTO(c);
                cs.setPeriodLabel(periodLabel);
                cs.setGoalCount(count);
                cs.setAverageCompletionPercent(avgCompletion);
                historicalCycles.add(cs);
            }

            PaginationDTO pagination = PaginationDTO.builder()
                    .page(page != null ? page : 1)
                    .pageSize(size)
                    .totalPages(cyclePage.getTotalPages())
                    .totalCount((int) cyclePage.getTotalElements())
                    .hasPrevious(cyclePage.hasPrevious())
                    .hasNext(cyclePage.hasNext())
                    .build();

            return HistoricalGoalsResponseDTO.builder()
                    .mode("historical_cycles")
                    .pagination(pagination)
                    .historicalCycles(historicalCycles)
                    .build();
        } else {
            UUID cycleUUID = UUID.fromString(cycleId);
            PerformanceCycle cycle = performanceCycleRepository.findById(cycleUUID)
                    .orElseThrow(() -> new NotFoundException("CYCLE_NOT_FOUND", "Cycle not found"));
            if (cycle.getStatus() != CycleStatus.COMPLETED && cycle.getStatus() != CycleStatus.CLOSED) {
                throw new NotFoundException("CYCLE_NOT_FOUND", "Cycle is not a historical cycle");
            }

            int pageIndex = (page != null && page > 0) ? page - 1 : 0;
            int size = (pageSize != null && pageSize > 0) ? pageSize : 10;

            // Apply q filter manually after fetch
            List<Goal> allGoals = goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycle.getId(), userId);
            if (q != null && !q.isBlank()) {
                String lq = q.toLowerCase();
                allGoals = allGoals.stream()
                        .filter(g -> (g.getTitle() != null && g.getTitle().toLowerCase().contains(lq))
                                || (g.getDescription() != null && g.getDescription().toLowerCase().contains(lq)))
                        .collect(Collectors.toList());
            }

            int total = allGoals.size();
            int fromIdx = Math.min(pageIndex * size, total);
            int toIdx = Math.min(fromIdx + size, total);
            List<Goal> pagedGoals = allGoals.subList(fromIdx, toIdx);

            List<UUID> goalIds = pagedGoals.stream().map(Goal::getId).collect(Collectors.toList());
            Map<UUID, GoalProgressUpdate> latestProgressMap = Collections.emptyMap();
            Map<UUID, GoalReview> latestReviewMap = Collections.emptyMap();
            if (!goalIds.isEmpty()) {
                latestProgressMap = goalProgressUpdateRepository.findLatestByGoalIds(goalIds).stream()
                        .collect(Collectors.toMap(GoalProgressUpdate::getGoalId, Function.identity()));
                latestReviewMap = goalReviewRepository.findLatestByGoalIds(goalIds).stream()
                        .collect(Collectors.toMap(GoalReview::getGoalId, Function.identity()));
            }

            User owner = userRepository.findById(userId).orElse(null);
            User manager = (owner != null && owner.getManagerId() != null)
                    ? userRepository.findById(owner.getManagerId()).orElse(null)
                    : null;

            List<GoalDTO> goalDTOs = new ArrayList<>();
            for (Goal goal : pagedGoals) {
                goalDTOs.add(buildGoalDTO(goal, owner, manager,
                        latestProgressMap.get(goal.getId()), latestReviewMap.get(goal.getId()), cycle));
            }

            int totalPages = (total == 0) ? 1 : (int) Math.ceil((double) total / size);
            PaginationDTO pagination = PaginationDTO.builder()
                    .page(page != null ? page : 1)
                    .pageSize(size)
                    .totalPages(totalPages)
                    .totalCount(total)
                    .hasPrevious(pageIndex > 0)
                    .hasNext(toIdx < total)
                    .build();

            GoalSummaryDTO summary = buildSummary(allGoals);
            double avgCompletion = allGoals.isEmpty() ? 0.0
                    : allGoals.stream().mapToInt(Goal::getProgressPercent).average().orElse(0.0);
            summary.setAverageCompletionPercent(avgCompletion);
            summary.setGoalCount(total);

            return HistoricalGoalsResponseDTO.builder()
                    .mode("historical_goals")
                    .cycle(buildCycleSummaryDTO(cycle))
                    .pagination(pagination)
                    .summary(summary)
                    .goals(goalDTOs)
                    .build();
        }
    }

    @Override
    @Transactional
    @Auditable(action = "CREATE_GOAL", resource = "goal", resourceIdFrom = "return.goal.goalId")
    public GoalCreationResponseDTO createGoal(UUID userId, GoalRequestDTO request) {
        PerformanceCycle cycle = getCurrentCycleOptional()
                .orElseThrow(() -> new NotFoundException("CYCLE_NOT_FOUND", "No current performance cycle found"));

        if (Boolean.TRUE.equals(cycle.getIsLocked())) {
            throw new ConflictException("REVIEW_LOCKED", "The review cycle is currently locked");
        }

        validateGoalRequest(request, cycle);

        Goal goal = Goal.builder()
                .id(UUID.randomUUID())
                .cycleId(cycle.getId())
                .ownerId(userId)
                .setBy(userId)
                .goalType(GoalType.INDIVIDUAL)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status(GoalStatus.PENDING_REVIEW)
                .progressPercent(0)
                .build();

        goal = goalRepository.save(goal);

        User owner = userRepository.findById(userId).orElse(null);
        User manager = (owner != null && owner.getManagerId() != null)
                ? userRepository.findById(owner.getManagerId()).orElse(null)
                : null;

        GoalDTO goalDTO = buildGoalDTO(goal, owner, manager, null, null, cycle);
        // pending_review: all actions false
        goalDTO.setAvailableActions(AvailableActionsDTO.builder()
                .canEdit(false)
                .editUnavailableReason("invalid_goal_status")
                .canUpdateProgress(false)
                .updateProgressUnavailableReason("invalid_goal_status")
                .build());

        return GoalCreationResponseDTO.builder().goal(goalDTO).build();
    }

    @Override
    @Transactional
    @Auditable(action = "RESUBMIT_GOAL", resource = "goal", resourceIdFrom = "goalId")
    public GoalCreationResponseDTO updateGoal(UUID userId, String goalId, GoalRequestDTO request) {
        UUID goalUUID = UUID.fromString(goalId);
        Goal goal = goalRepository.findById(goalUUID)
                .filter(g -> g.getDeletedAt() == null)
                .orElseThrow(() -> new NotFoundException("GOAL_NOT_FOUND", "Goal not found"));

        if (!goal.getOwnerId().equals(userId)) {
            throw new ForbiddenException("FORBIDDEN", "You do not have permission to update this goal");
        }

        PerformanceCycle cycle = performanceCycleRepository.findById(goal.getCycleId())
                .orElseThrow(() -> new NotFoundException("CYCLE_NOT_FOUND", "Cycle not found"));

        if (Boolean.TRUE.equals(cycle.getIsLocked())) {
            throw new ConflictException("REVIEW_LOCKED", "The review cycle is currently locked");
        }

        if (goal.getStatus() != GoalStatus.REVISION_REQUESTED) {
            throw new ConflictException("INVALID_GOAL_STATUS", "Goal can only be updated when status is revision_requested");
        }

        validateGoalRequest(request, cycle);

        goal.setTitle(request.getTitle());
        goal.setDescription(request.getDescription());
        goal.setDueDate(request.getDueDate());
        goal.setStatus(GoalStatus.PENDING_REVIEW);
        goal = goalRepository.save(goal);

        User owner = userRepository.findById(userId).orElse(null);
        User manager = (owner != null && owner.getManagerId() != null)
                ? userRepository.findById(owner.getManagerId()).orElse(null)
                : null;

        GoalDTO goalDTO = buildGoalDTO(goal, owner, manager, null, null, cycle);
        goalDTO.setAvailableActions(AvailableActionsDTO.builder()
                .canEdit(false)
                .editUnavailableReason("invalid_goal_status")
                .canUpdateProgress(false)
                .updateProgressUnavailableReason("invalid_goal_status")
                .build());

        return GoalCreationResponseDTO.builder().goal(goalDTO).build();
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_GOAL_PROGRESS", resource = "goal", resourceIdFrom = "goalId")
    public GoalProgressUpdateResponseDTO updateGoalProgress(UUID userId, String goalId, GoalProgressUpdateRequestDTO request) {
        UUID goalUUID = UUID.fromString(goalId);
        Goal goal = goalRepository.findById(goalUUID)
                .orElseThrow(() -> new NotFoundException("GOAL_NOT_FOUND", "Goal not found"));

        if (!goal.getOwnerId().equals(userId)) {
            throw new ForbiddenException("FORBIDDEN", "You do not have permission to update this goal");
        }

        PerformanceCycle cycle = performanceCycleRepository.findById(goal.getCycleId())
                .orElseThrow(() -> new NotFoundException("CYCLE_NOT_FOUND", "Cycle not found"));

        if (Boolean.TRUE.equals(cycle.getIsLocked())) {
            throw new ConflictException("REVIEW_LOCKED", "The review cycle is currently locked");
        }

        if (goal.getStatus() != GoalStatus.IN_PROGRESS) {
            throw new ConflictException("INVALID_GOAL_STATUS", "Goal progress can only be updated when status is in_progress");
        }

        int percent = request.getProgressPercent();
        if (percent < 0 || percent > 100) {
            throw new ConflictException("INVALID_PROGRESS_PERCENT", "Progress percent must be between 0 and 100");
        }

        GoalProgressUpdate update = GoalProgressUpdate.builder()
                .id(UUID.randomUUID())
                .goalId(goalUUID)
                .progressPercent(percent)
                .note(request.getNote())
                .updatedBy(userId)
                .recordedAt(OffsetDateTime.now())
                .build();
        update = goalProgressUpdateRepository.save(update);

        goal.setProgressPercent(percent);
        if (percent == 100) {
            goal.setStatus(GoalStatus.COMPLETED);
        }
        goal = goalRepository.save(goal);

        User owner = userRepository.findById(userId).orElse(null);
        User manager = (owner != null && owner.getManagerId() != null)
                ? userRepository.findById(owner.getManagerId()).orElse(null)
                : null;

        GoalProgressUpdateDTO progressDTO = GoalProgressUpdateDTO.builder()
                .progressUpdateId(update.getId().toString())
                .goalId(goalId)
                .progressPercent(update.getProgressPercent())
                .note(update.getNote())
                .createdAt(update.getRecordedAt())
                .createdBy(owner != null
                        ? GoalProgressUpdateDTO.ProgressUpdateCreatorDTO.builder()
                        .userId(owner.getId().toString())
                        .name(owner.getFullName())
                        .build()
                        : null)
                .build();

        GoalDTO goalDTO = buildGoalDTO(goal, owner, manager, update, null, cycle);

        return GoalProgressUpdateResponseDTO.builder()
                .progressUpdate(progressDTO)
                .goal(goalDTO)
                .build();
    }

    @Override
    public GoalReviewResultResponseDTO getGoalReviewResult(UUID userId, String goalId) {
        PerformanceCycle cycle = getCurrentCycleOptional()
                .orElseThrow(() -> new NotFoundException("CYCLE_NOT_FOUND", "No current performance cycle found"));

        // If specific goalId requested, validate ownership
        if (goalId != null) {
            UUID goalUUID = UUID.fromString(goalId);
            goalRepository.findById(goalUUID)
                    .filter(g -> g.getOwnerId().equals(userId))
                    .orElseThrow(() -> new NotFoundException("GOAL_NOT_FOUND", "Goal not found"));
        }

        List<Goal> allGoals = goalRepository.findByCycleIdAndOwnerIdAndDeletedAtIsNull(cycle.getId(), userId);
        List<UUID> goalIds = allGoals.stream().map(Goal::getId).collect(Collectors.toList());

        Map<UUID, GoalReview> latestReviewMap = Collections.emptyMap();
        if (!goalIds.isEmpty()) {
            latestReviewMap = goalReviewRepository.findLatestByGoalIds(goalIds).stream()
                    .collect(Collectors.toMap(GoalReview::getGoalId, Function.identity()));
        }

        String overallStatus = computeOverallStatus(allGoals);

        ManagerDTO reviewer = null;
        OffsetDateTime reviewedAt = null;

        // Find latest reviewer from most recent goal review
        if (!goalIds.isEmpty()) {
            final Map<UUID, GoalReview> finalMap = latestReviewMap;
            Optional<GoalReview> latestReview = allGoals.stream()
                    .map(g -> finalMap.get(g.getId()))
                    .filter(Objects::nonNull)
                    .max(Comparator.comparing(GoalReview::getReviewedAt));

            if (latestReview.isPresent()) {
                reviewedAt = latestReview.get().getReviewedAt();
                User reviewerUser = userRepository.findById(latestReview.get().getReviewedBy()).orElse(null);
                if (reviewerUser != null) {
                    reviewer = ManagerDTO.builder()
                            .userId(reviewerUser.getId().toString())
                            .name(reviewerUser.getFullName())
                            .englishName(reviewerUser.getEnglishName())
                            .email(reviewerUser.getEmail())
                            .title(reviewerUser.getJobTitle())
                            .build();
                }
            }
        }

        GoalSummaryDTO summary = buildSummary(allGoals);

        final Map<UUID, GoalReview> latestReviewMapFinal = latestReviewMap;
        List<GoalReviewResultDTO> results = allGoals.stream().map(goal -> {
            GoalReview gr = latestReviewMapFinal.get(goal.getId());
            ManagerDTO grReviewer = null;
            if (gr != null) {
                User rv = userRepository.findById(gr.getReviewedBy()).orElse(null);
                if (rv != null) {
                    grReviewer = ManagerDTO.builder()
                            .userId(rv.getId().toString())
                            .name(rv.getFullName())
                            .title(rv.getJobTitle())
                            .build();
                }
            }
            return GoalReviewResultDTO.builder()
                    .goalId(goal.getId().toString())
                    .title(goal.getTitle())
                    .status(goal.getStatus() != null ? goal.getStatus().getDbValue() : null)
                    .decision(gr != null && gr.getDecision() != null ? gr.getDecision().getDbValue() : null)
                    .comment(gr != null ? gr.getComment() : null)
                    .reviewedAt(gr != null ? gr.getReviewedAt() : null)
                    .reviewer(grReviewer)
                    .build();
        }).collect(Collectors.toList());

        return GoalReviewResultResponseDTO.builder()
                .cycle(buildCycleSummaryDTO(cycle))
                .overallStatus(overallStatus)
                .summary(summary)
                .reviewedAt(reviewedAt)
                .reviewer(reviewer)
                .results(results)
                .build();
    }

    // ---- helper methods ----

    private GoalDTO buildGoalDTO(Goal goal, User owner, User manager,
                                  GoalProgressUpdate latestProgress, GoalReview latestReview,
                                  PerformanceCycle cycle) {
        boolean locked = Boolean.TRUE.equals(cycle.getIsLocked());
        GoalStatus status = goal.getStatus();

        boolean canEdit = status == GoalStatus.REVISION_REQUESTED && !locked;
        boolean canUpdateProgress = status == GoalStatus.IN_PROGRESS && !locked;

        String editUnavailableReason = null;
        if (!canEdit) {
            if (status != GoalStatus.REVISION_REQUESTED) {
                editUnavailableReason = "invalid_goal_status";
            } else {
                editUnavailableReason = "review_locked";
            }
        }

        String updateProgressUnavailableReason = null;
        if (!canUpdateProgress) {
            if (status != GoalStatus.IN_PROGRESS) {
                updateProgressUnavailableReason = "invalid_goal_status";
            } else {
                updateProgressUnavailableReason = "review_locked";
            }
        }

        GoalDTO.GoalOwnerDTO ownerDTO = null;
        if (owner != null) {
            Department dept = owner.getDepartmentId() != null
                    ? departmentRepository.findById(owner.getDepartmentId()).orElse(null)
                    : null;
            ownerDTO = GoalDTO.GoalOwnerDTO.builder()
                    .userId(owner.getId().toString())
                    .name(owner.getFullName())
                    .department(dept != null ? dept.getName() : null)
                    .build();
        }

        ManagerDTO reviewerDTO = null;
        if (manager != null) {
            reviewerDTO = ManagerDTO.builder()
                    .userId(manager.getId().toString())
                    .name(manager.getFullName())
                    .englishName(manager.getEnglishName())
                    .email(manager.getEmail())
                    .title(manager.getJobTitle())
                    .build();
        }

        GoalProgressUpdateDTO latestProgressDTO = null;
        if (latestProgress != null) {
            latestProgressDTO = GoalProgressUpdateDTO.builder()
                    .progressUpdateId(latestProgress.getId().toString())
                    .progressPercent(latestProgress.getProgressPercent())
                    .note(latestProgress.getNote())
                    .createdAt(latestProgress.getRecordedAt())
                    .createdBy(GoalProgressUpdateDTO.ProgressUpdateCreatorDTO.builder()
                            .userId(latestProgress.getUpdatedBy().toString())
                            .name(owner != null ? owner.getFullName() : null)
                            .build())
                    .build();
        }

        GoalReviewDTO latestReviewDTO = null;
        if (latestReview != null) {
            ManagerDTO reviewerOfReview = null;
            User reviewerUser = userRepository.findById(latestReview.getReviewedBy()).orElse(null);
            if (reviewerUser != null) {
                reviewerOfReview = ManagerDTO.builder()
                        .userId(reviewerUser.getId().toString())
                        .name(reviewerUser.getFullName())
                        .title(reviewerUser.getJobTitle())
                        .build();
            }
            latestReviewDTO = GoalReviewDTO.builder()
                    .reviewId(latestReview.getId().toString())
                    .decision(latestReview.getDecision() != null ? latestReview.getDecision().getDbValue() : null)
                    .comment(latestReview.getComment())
                    .reviewedAt(latestReview.getReviewedAt())
                    .reviewer(reviewerOfReview)
                    .build();
        }

        return GoalDTO.builder()
                .goalId(goal.getId().toString())
                .cycleId(goal.getCycleId().toString())
                .goalType(goal.getGoalType() != null ? goal.getGoalType().getDbValue() : null)
                .title(goal.getTitle())
                .description(goal.getDescription())
                .dueDate(goal.getDueDate())
                .status(status != null ? status.getDbValue() : null)
                .progressPercent(goal.getProgressPercent())
                .owner(ownerDTO)
                .reviewer(reviewerDTO)
                .latestProgressUpdate(latestProgressDTO)
                .latestReview(latestReviewDTO)
                .availableActions(AvailableActionsDTO.builder()
                        .canEdit(canEdit)
                        .editUnavailableReason(editUnavailableReason)
                        .canUpdateProgress(canUpdateProgress)
                        .updateProgressUnavailableReason(updateProgressUnavailableReason)
                        .build())
                .publishedAt(goal.getPublishedAt())
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }

    private GoalSummaryDTO buildSummary(List<Goal> goals) {
        int total = goals.size();
        int pending = 0, inProgress = 0, revisionRequested = 0, completed = 0, cancelled = 0;
        for (Goal g : goals) {
            if (g.getStatus() == GoalStatus.PENDING_REVIEW) pending++;
            else if (g.getStatus() == GoalStatus.IN_PROGRESS) inProgress++;
            else if (g.getStatus() == GoalStatus.REVISION_REQUESTED) revisionRequested++;
            else if (g.getStatus() == GoalStatus.COMPLETED) completed++;
            else if (g.getStatus() == GoalStatus.CANCELLED) cancelled++;
        }
        return GoalSummaryDTO.builder()
                .totalCount(total)
                .pendingReviewCount(pending)
                .inProgressCount(inProgress)
                .revisionRequestedCount(revisionRequested)
                .completedCount(completed)
                .cancelledCount(cancelled)
                .build();
    }

    private String computeOverallStatus(List<Goal> goals) {
        if (goals.isEmpty()) return "no_goals";
        boolean anyRevision = goals.stream().anyMatch(g -> g.getStatus() == GoalStatus.REVISION_REQUESTED);
        if (anyRevision) return "revision_requested";
        boolean anyPending = goals.stream().anyMatch(g -> g.getStatus() == GoalStatus.PENDING_REVIEW);
        if (anyPending) return "pending_review";
        boolean anyInProgress = goals.stream().anyMatch(g -> g.getStatus() == GoalStatus.IN_PROGRESS);
        if (anyInProgress) return "in_progress";
        boolean anyCompleted = goals.stream().anyMatch(g -> g.getStatus() == GoalStatus.COMPLETED);
        boolean allDone = goals.stream().allMatch(g -> g.getStatus() == GoalStatus.COMPLETED || g.getStatus() == GoalStatus.CANCELLED);
        if (allDone && anyCompleted) return "completed";
        boolean allCancelled = goals.stream().allMatch(g -> g.getStatus() == GoalStatus.CANCELLED);
        if (allCancelled) return "cancelled";
        return "in_progress";
    }

    private void validateGoalRequest(GoalRequestDTO request, PerformanceCycle cycle) {
        if (request.getTitle() == null || request.getTitle().isBlank() || request.getTitle().length() > 100) {
            throw new ConflictException("INVALID_TITLE", "Title must be between 1 and 100 characters");
        }
        if (request.getDescription() != null && (request.getDescription().isBlank() || request.getDescription().length() > 2000)) {
            throw new ConflictException("INVALID_DESCRIPTION", "Description must be between 1 and 2000 characters");
        }
        if (request.getDueDate() != null) {
            LocalDate cycleStart = cycle.getSelfEvalStart().toLocalDate();
            LocalDate cycleEnd = cycle.getHrReviewEnd().toLocalDate();
            if (request.getDueDate().isBefore(cycleStart) || request.getDueDate().isAfter(cycleEnd)) {
                throw new ConflictException("INVALID_DUE_DATE", "Due date must be within the cycle period");
            }
        }
    }

    private Optional<PerformanceCycle> getCurrentCycleOptional() {
        List<CycleStatus> activeStatuses = List.of(
                CycleStatus.NOT_STARTED,
                CycleStatus.IN_PROGRESS,
                CycleStatus.LOCKED,
                CycleStatus.RESULTS_PUBLISHED,
                CycleStatus.COMPLETED
        );
        List<PerformanceCycle> cycles = performanceCycleRepository.findByStatusIn(activeStatuses);
        return cycles.stream()
                .min(Comparator.comparingInt((PerformanceCycle c) -> statusPriority(c.getStatus()))
                        .thenComparing(Comparator.comparing(PerformanceCycle::getUpdatedAt).reversed()));
    }

    private int statusPriority(CycleStatus status) {
        return switch (status) {
            case IN_PROGRESS -> 1;
            case LOCKED -> 2;
            case RESULTS_PUBLISHED -> 3;
            case COMPLETED -> 4;
            case NOT_STARTED -> 5;
            default -> 99;
        };
    }

    private CycleSummaryDTO buildCycleSummaryDTO(PerformanceCycle cycle) {
        LocalDate startDate = cycle.getSelfEvalStart() != null ? cycle.getSelfEvalStart().toLocalDate() : null;
        LocalDate endDate = cycle.getHrReviewEnd() != null ? cycle.getHrReviewEnd().toLocalDate() : null;
        String periodLabel = (startDate != null && endDate != null) ? startDate + "~" + endDate : null;
        return CycleSummaryDTO.builder()
                .cycleId(cycle.getId().toString())
                .name(cycle.getName())
                .cycleType(cycle.getCycleType() != null ? cycle.getCycleType().getDbValue() : null)
                .periodLabel(periodLabel)
                .startDate(startDate)
                .endDate(endDate)
                .timezone(cycle.getTimezone())
                .status(cycle.getStatus() != null ? cycle.getStatus().getDbValue() : null)
                .isLocked(cycle.getIsLocked())
                .resultsPublishedAt(cycle.getResultsPublishedAt())
                .updatedAt(cycle.getUpdatedAt())
                .build();
    }
}

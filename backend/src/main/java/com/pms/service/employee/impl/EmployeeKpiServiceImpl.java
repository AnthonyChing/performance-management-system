package com.pms.service.employee.impl;

import com.pms.audit.Auditable;
import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.PaginationDTO;
import com.pms.dto.employee.kpi.*;
import com.pms.dto.employee.kpi.KpiResponsesDTO.*;
import com.pms.entity.*;
import com.pms.entity.enums.CycleStatus;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.*;
import com.pms.service.employee.EmployeeKpiService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmployeeKpiServiceImpl implements EmployeeKpiService {

    private final UserRepository userRepository;
    private final PerformanceCycleRepository performanceCycleRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final KpiRepository kpiRepository;
    private final KpiAssignmentRepository kpiAssignmentRepository;
    private final KpiProgressSnapshotRepository kpiProgressSnapshotRepository;
    private final KpiResultConfirmationRepository kpiResultConfirmationRepository;
    private final AppealRepository appealRepository;

    @Override
    public KpiStandardsResponseDTO getKpiStandards(UUID userId) {
        PerformanceCycle cycle =
                getCurrentCycleOptional()
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "CURRENT_KPI_CYCLE_NOT_FOUND",
                                                "No current KPI cycle found"));

        PerformanceReview review =
                performanceReviewRepository
                        .findByCycleIdAndEmployeeId(cycle.getId(), userId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "KPI_REVIEW_NOT_FOUND",
                                                "No performance review found for current cycle"));

        List<Kpi> kpis = kpiRepository.findByCycleIdAndDeletedAtIsNull(cycle.getId());
        List<UUID> kpiIds = kpis.stream().map(Kpi::getId).collect(Collectors.toList());
        List<KpiAssignment> assignments =
                kpiAssignmentRepository.findByUserIdAndKpiIdIn(userId, kpiIds);

        Map<UUID, KpiAssignment> assignmentMap =
                assignments.stream()
                        .collect(Collectors.toMap(KpiAssignment::getKpiId, Function.identity()));

        List<KpiStandardDTO> standards =
                kpis.stream()
                        .filter(kpi -> assignmentMap.containsKey(kpi.getId()))
                        .map(
                                kpi -> {
                                    KpiAssignment assignment = assignmentMap.get(kpi.getId());
                                    return KpiStandardDTO.builder()
                                            .kpiId(kpi.getId().toString())
                                            .name(kpi.getTitle())
                                            .description(kpi.getDescription())
                                            .weightPercent(
                                                    assignment.getWeight() != null
                                                            ? assignment.getWeight().intValue()
                                                            : 0)
                                            .target(
                                                    KpiStandardDTO.KpiTargetDTO.builder()
                                                            .operator(kpi.getTargetOperator())
                                                            .value(
                                                                    kpi.getTargetDisplayText()
                                                                                    != null
                                                                            ? (assignment
                                                                                                    .getTargetValue()
                                                                                            != null
                                                                                    ? assignment
                                                                                            .getTargetValue()
                                                                                            .doubleValue()
                                                                                    : null)
                                                                            : (kpi.getTargetValue()
                                                                                            != null
                                                                                    ? kpi.getTargetValue()
                                                                                            .doubleValue()
                                                                                    : null))
                                                            .unit(kpi.getTargetUnit())
                                                            .displayText(kpi.getTargetDisplayText())
                                                            .build())
                                            .build();
                                })
                        .collect(Collectors.toList());

        User user = userRepository.findById(userId).orElse(null);
        KpiResultSummaryDTO.EmployeeSummaryDTO employeeDTO = buildEmployeeSummaryDTO(user);

        return KpiStandardsResponseDTO.builder()
                .cycle(buildCycleSummaryDTO(cycle))
                .employee(employeeDTO)
                .standards(standards)
                .build();
    }

    @Override
    public KpiResultResponseDTO getKpiResult(UUID userId) {
        PerformanceCycle cycle =
                getCurrentCycleOptional()
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "CURRENT_KPI_CYCLE_NOT_FOUND",
                                                "No current KPI cycle found"));

        PerformanceReview review =
                performanceReviewRepository
                        .findByCycleIdAndEmployeeId(cycle.getId(), userId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "KPI_REVIEW_NOT_FOUND",
                                                "No performance review found for current cycle"));

        String resultStatus = computeKpiResultStatus(cycle, review, userId);
        User user = userRepository.findById(userId).orElse(null);
        KpiResultSummaryDTO.EmployeeSummaryDTO employeeDTO = buildEmployeeSummaryDTO(user);

        if ("not_published".equals(resultStatus)) {
            return KpiResultResponseDTO.builder()
                    .result(
                            KpiResultSummaryDTO.builder()
                                    .resultId(review.getId().toString())
                                    .cycle(buildCycleSummaryDTO(cycle))
                                    .employee(employeeDTO)
                                    .status(resultStatus)
                                    .availableActions(
                                            AvailableActionsDTO.builder()
                                                    .canConfirm(false)
                                                    .confirmUnavailableReason(
                                                            "result_not_published")
                                                    .canDispute(false)
                                                    .disputeUnavailableReason(
                                                            "result_not_published")
                                                    .build())
                                    .build())
                    .build();
        }

        List<Kpi> kpis = kpiRepository.findByCycleIdAndDeletedAtIsNull(cycle.getId());
        List<UUID> kpiIds = kpis.stream().map(Kpi::getId).collect(Collectors.toList());
        List<KpiAssignment> assignments =
                kpiAssignmentRepository.findByUserIdAndKpiIdIn(userId, kpiIds);
        Map<UUID, KpiAssignment> assignmentMap =
                assignments.stream()
                        .collect(Collectors.toMap(KpiAssignment::getKpiId, Function.identity()));
        List<Kpi> assignedKpis =
                kpis.stream()
                        .filter(k -> assignmentMap.containsKey(k.getId()))
                        .collect(Collectors.toList());

        double totalWeightedScore = 0.0;
        List<KpiResultDTO> kpiResults = new ArrayList<>();
        for (Kpi kpi : assignedKpis) {
            KpiAssignment assignment = assignmentMap.get(kpi.getId());
            double targetVal =
                    assignment.getTargetValue() != null
                            ? assignment.getTargetValue().doubleValue()
                            : 1.0;
            Double currentValBoxed =
                    assignment.getCurrentValue() != null
                            ? assignment.getCurrentValue().doubleValue()
                            : null;
            double currentVal = currentValBoxed != null ? currentValBoxed : 0.0;
            double weight =
                    assignment.getWeight() != null ? assignment.getWeight().doubleValue() : 0.0;
            double achievementPercent = targetVal > 0 ? (currentVal / targetVal * 100.0) : 0.0;
            double score = targetVal > 0 ? (currentVal / targetVal * weight) : 0.0;
            totalWeightedScore += score;

            Optional<KpiProgressSnapshot> snapshotOpt =
                    kpiProgressSnapshotRepository.findTopByKpiIdAndUserIdOrderByRecordedAtDesc(
                            kpi.getId(), userId);
            KpiResultDTO.KpiSnapshotDTO snapshotDTO =
                    snapshotOpt
                            .map(
                                    s ->
                                            KpiResultDTO.KpiSnapshotDTO.builder()
                                                    .snapshotId(String.valueOf(s.getId()))
                                                    .value(
                                                            s.getValue() != null
                                                                    ? s.getValue().doubleValue()
                                                                    : null)
                                                    .note(s.getNote())
                                                    .recordedAt(s.getRecordedAt())
                                                    .build())
                            .orElse(null);

            kpiResults.add(
                    KpiResultDTO.builder()
                            .kpiId(kpi.getId().toString())
                            .name(kpi.getTitle())
                            .weightPercent((int) weight)
                            .actual(
                                    KpiResultDTO.KpiActualDTO.builder()
                                            .value(currentValBoxed)
                                            .unit(kpi.getUnit())
                                            .displayText(
                                                    currentValBoxed != null
                                                            ? String.valueOf(currentValBoxed)
                                                            : null)
                                            .build())
                            .target(
                                    KpiStandardDTO.KpiTargetDTO.builder()
                                            .operator(kpi.getTargetOperator())
                                            .value(targetVal)
                                            .unit(kpi.getTargetUnit())
                                            .displayText(kpi.getTargetDisplayText())
                                            .build())
                            .achievementPercent(round(achievementPercent))
                            .score(round(score))
                            .latestSnapshot(snapshotDTO)
                            .build());
        }

        Optional<KpiResultConfirmation> confirmationOpt =
                kpiResultConfirmationRepository.findByReviewId(review.getId());

        // Compute dispute period
        OffsetDateTime publishedAt = cycle.getResultsPublishedAt();
        OffsetDateTime disputeEnd = publishedAt.plusDays(cycle.getAppealDeadlineDays());
        OffsetDateTime now = OffsetDateTime.now();
        String disputeStatus;
        if (now.isBefore(publishedAt)) {
            disputeStatus = "not_open";
        } else if (!now.isAfter(disputeEnd) && "pending_confirmation".equals(resultStatus)) {
            disputeStatus = "open";
        } else {
            disputeStatus = "closed";
        }

        KpiResultSummaryDTO.DisputePeriodDTO disputePeriod =
                KpiResultSummaryDTO.DisputePeriodDTO.builder()
                        .status(disputeStatus)
                        .startDate(publishedAt.toLocalDate().toString())
                        .endDate(disputeEnd.toLocalDate().toString())
                        .timezone(cycle.getTimezone())
                        .build();

        boolean canConfirm = "pending_confirmation".equals(resultStatus);
        boolean canDispute =
                "pending_confirmation".equals(resultStatus) && "open".equals(disputeStatus);

        KpiResultSummaryDTO.KpiConfirmationDTO confirmationDTO = null;
        if (confirmationOpt.isPresent()) {
            KpiResultConfirmation conf = confirmationOpt.get();
            confirmationDTO =
                    KpiResultSummaryDTO.KpiConfirmationDTO.builder()
                            .confirmationId(conf.getId().toString())
                            .resultId(review.getId().toString())
                            .confirmedAt(conf.getConfirmedAt())
                            .confirmedBy(
                                    buildEmployeeSummaryDTO(
                                            userRepository
                                                    .findById(conf.getConfirmedBy())
                                                    .orElse(null)))
                            .build();
        }

        return KpiResultResponseDTO.builder()
                .result(
                        KpiResultSummaryDTO.builder()
                                .resultId(review.getId().toString())
                                .cycle(buildCycleSummaryDTO(cycle))
                                .employee(employeeDTO)
                                .status(resultStatus)
                                .publishedAt(publishedAt)
                                .weightedScore(round(totalWeightedScore))
                                .kpiResults(kpiResults)
                                .availableActions(
                                        AvailableActionsDTO.builder()
                                                .canConfirm(canConfirm)
                                                .confirmUnavailableReason(
                                                        canConfirm
                                                                ? null
                                                                : "already_" + resultStatus)
                                                .canDispute(canDispute)
                                                .disputeUnavailableReason(
                                                        canDispute
                                                                ? null
                                                                : disputeStatus.equals("open")
                                                                        ? null
                                                                        : disputeStatus)
                                                .build())
                                .confirmation(confirmationDTO)
                                .disputePeriod(disputePeriod)
                                .updatedAt(review.getUpdatedAt())
                                .build())
                .build();
    }

    @Override
    @Transactional
    @Auditable(action = "CONFIRM_KPI_RESULT", resource = "kpi_result_confirmation")
    public KpiConfirmationResponseDTO confirmKpiResult(
            UUID userId, KpiConfirmationRequestDTO request) {
        if (!Boolean.TRUE.equals(request.getConfirmed())) {
            throw new ConflictException("INVALID_CONFIRMATION", "Confirmed must be true");
        }

        UUID reviewId = UUID.fromString(request.getResultId());
        PerformanceReview review =
                performanceReviewRepository
                        .findById(reviewId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "KPI_RESULT_NOT_FOUND",
                                                "KPI result (review) not found"));

        if (!review.getEmployeeId().equals(userId)) {
            throw new ForbiddenException(
                    "FORBIDDEN", "You do not have permission to confirm this KPI result");
        }

        PerformanceCycle cycle =
                performanceCycleRepository
                        .findById(review.getCycleId())
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "CURRENT_KPI_CYCLE_NOT_FOUND", "Cycle not found"));

        String resultStatus = computeKpiResultStatus(cycle, review, userId);
        if (!"pending_confirmation".equals(resultStatus)) {
            if ("confirmed".equals(resultStatus)) {
                throw new ConflictException(
                        "KPI_RESULT_ALREADY_CONFIRMED", "KPI result has already been confirmed");
            } else if ("disputed".equals(resultStatus)) {
                throw new ConflictException(
                        "KPI_RESULT_ALREADY_DISPUTED", "KPI result has already been disputed");
            } else {
                throw new ConflictException(
                        "INVALID_KPI_RESULT_STATUS",
                        "KPI result cannot be confirmed in current status: " + resultStatus);
            }
        }

        if (kpiResultConfirmationRepository.findByReviewId(reviewId).isPresent()) {
            throw new ConflictException(
                    "KPI_RESULT_ALREADY_CONFIRMED", "KPI result has already been confirmed");
        }
        if (appealRepository.findByReviewId(reviewId).isPresent()) {
            throw new ConflictException(
                    "KPI_RESULT_ALREADY_DISPUTED", "KPI result has already been disputed");
        }

        KpiResultConfirmation confirmation =
                KpiResultConfirmation.builder()
                        .id(UUID.randomUUID())
                        .reviewId(reviewId)
                        .confirmedBy(userId)
                        .confirmedAt(OffsetDateTime.now())
                        .build();
        confirmation = kpiResultConfirmationRepository.save(confirmation);

        User user = userRepository.findById(userId).orElse(null);
        KpiResultSummaryDTO.KpiConfirmationDTO confirmationDTO =
                KpiResultSummaryDTO.KpiConfirmationDTO.builder()
                        .confirmationId(confirmation.getId().toString())
                        .resultId(reviewId.toString())
                        .confirmedAt(confirmation.getConfirmedAt())
                        .confirmedBy(buildEmployeeSummaryDTO(user))
                        .build();

        KpiResultSummaryDTO resultSummary =
                KpiResultSummaryDTO.builder()
                        .resultId(review.getId().toString())
                        .cycle(buildCycleSummaryDTO(cycle))
                        .employee(buildEmployeeSummaryDTO(user))
                        .status("confirmed")
                        .confirmation(confirmationDTO)
                        .availableActions(
                                AvailableActionsDTO.builder()
                                        .canConfirm(false)
                                        .confirmUnavailableReason("already_confirmed")
                                        .canDispute(false)
                                        .disputeUnavailableReason("already_confirmed")
                                        .build())
                        .build();

        return KpiConfirmationResponseDTO.builder()
                .confirmation(confirmationDTO)
                .result(resultSummary)
                .build();
    }

    @Override
    public HistoricalKpiResultsResponseDTO getHistoricalKpiResults(
            UUID userId, Integer page, Integer pageSize, String q, String cycleId) {
        if (cycleId == null) {
            List<PerformanceReview> reviews = performanceReviewRepository.findByEmployeeId(userId);
            Set<UUID> reviewCycleIds =
                    reviews.stream().map(PerformanceReview::getCycleId).collect(Collectors.toSet());

            List<CycleStatus> historicalStatuses =
                    List.of(CycleStatus.COMPLETED, CycleStatus.CLOSED);
            List<PerformanceCycle> historicalCycles =
                    performanceCycleRepository.findByStatusIn(historicalStatuses).stream()
                            .filter(c -> reviewCycleIds.contains(c.getId()))
                            .sorted(
                                    Comparator.comparing(PerformanceCycle::getHrReviewEnd)
                                            .reversed())
                            .collect(Collectors.toList());

            // apply q filter on cycle name
            if (q != null && !q.isBlank()) {
                String lq = q.toLowerCase();
                historicalCycles =
                        historicalCycles.stream()
                                .filter(
                                        c ->
                                                c.getName() != null
                                                        && c.getName().toLowerCase().contains(lq))
                                .collect(Collectors.toList());
            }

            int total = historicalCycles.size();
            int size = (pageSize != null && pageSize > 0) ? pageSize : 10;
            int pageIndex = (page != null && page > 0) ? page - 1 : 0;
            int fromIdx = Math.min(pageIndex * size, total);
            int toIdx = Math.min(fromIdx + size, total);
            List<PerformanceCycle> pagedCycles = historicalCycles.subList(fromIdx, toIdx);

            Map<UUID, PerformanceReview> reviewByCycleId =
                    reviews.stream()
                            .collect(
                                    Collectors.toMap(
                                            PerformanceReview::getCycleId,
                                            Function.identity(),
                                            (a, b) -> a));

            List<KpiResultSummaryDTO> results =
                    pagedCycles.stream()
                            .map(
                                    c -> {
                                        PerformanceReview r = reviewByCycleId.get(c.getId());
                                        return KpiResultSummaryDTO.builder()
                                                .resultId(r != null ? r.getId().toString() : null)
                                                .cycle(buildCycleSummaryDTO(c))
                                                .employee(
                                                        buildEmployeeSummaryDTO(
                                                                userRepository
                                                                        .findById(userId)
                                                                        .orElse(null)))
                                                .status(
                                                        r != null
                                                                ? r.getStatus().getDbValue()
                                                                : null)
                                                .build();
                                    })
                            .collect(Collectors.toList());

            int totalPages = total == 0 ? 1 : (int) Math.ceil((double) total / size);
            PaginationDTO pagination =
                    PaginationDTO.builder()
                            .page(page != null ? page : 1)
                            .pageSize(size)
                            .totalPages(totalPages)
                            .totalCount(total)
                            .hasPrevious(pageIndex > 0)
                            .hasNext(toIdx < total)
                            .build();

            return HistoricalKpiResultsResponseDTO.builder()
                    .mode("historical_results")
                    .pagination(pagination)
                    .results(results)
                    .build();
        } else {
            UUID cycleUUID = UUID.fromString(cycleId);
            PerformanceCycle cycle =
                    performanceCycleRepository
                            .findById(cycleUUID)
                            .orElseThrow(
                                    () ->
                                            new NotFoundException(
                                                    "CYCLE_NOT_FOUND", "Cycle not found"));
            if (cycle.getStatus() != CycleStatus.COMPLETED
                    && cycle.getStatus() != CycleStatus.CLOSED) {
                throw new NotFoundException("CYCLE_NOT_FOUND", "Cycle is not a historical cycle");
            }

            PerformanceReview review =
                    performanceReviewRepository
                            .findByCycleIdAndEmployeeId(cycle.getId(), userId)
                            .orElseThrow(
                                    () ->
                                            new NotFoundException(
                                                    "KPI_REVIEW_NOT_FOUND",
                                                    "No KPI review found for cycle"));

            List<Kpi> kpis = kpiRepository.findByCycleIdAndDeletedAtIsNull(cycle.getId());
            List<UUID> kpiIds = kpis.stream().map(Kpi::getId).collect(Collectors.toList());
            List<KpiAssignment> assignments =
                    kpiAssignmentRepository.findByUserIdAndKpiIdIn(userId, kpiIds);
            Map<UUID, KpiAssignment> assignmentMap =
                    assignments.stream()
                            .collect(
                                    Collectors.toMap(KpiAssignment::getKpiId, Function.identity()));

            List<KpiStandardDTO> standards =
                    kpis.stream()
                            .filter(k -> assignmentMap.containsKey(k.getId()))
                            .map(
                                    k -> {
                                        KpiAssignment a = assignmentMap.get(k.getId());
                                        return KpiStandardDTO.builder()
                                                .kpiId(k.getId().toString())
                                                .name(k.getTitle())
                                                .description(k.getDescription())
                                                .weightPercent(
                                                        a.getWeight() != null
                                                                ? a.getWeight().intValue()
                                                                : 0)
                                                .target(
                                                        KpiStandardDTO.KpiTargetDTO.builder()
                                                                .operator(k.getTargetOperator())
                                                                .value(
                                                                        a.getTargetValue() != null
                                                                                ? a.getTargetValue()
                                                                                        .doubleValue()
                                                                                : null)
                                                                .unit(k.getTargetUnit())
                                                                .displayText(
                                                                        k.getTargetDisplayText())
                                                                .build())
                                                .build();
                                    })
                            .collect(Collectors.toList());

            User user = userRepository.findById(userId).orElse(null);
            KpiResultSummaryDTO result =
                    KpiResultSummaryDTO.builder()
                            .resultId(review.getId().toString())
                            .cycle(buildCycleSummaryDTO(cycle))
                            .employee(buildEmployeeSummaryDTO(user))
                            .status(
                                    review.getStatus() != null
                                            ? review.getStatus().getDbValue()
                                            : null)
                            .build();

            return HistoricalKpiResultsResponseDTO.builder()
                    .mode("historical_result_detail")
                    .standards(standards)
                    .result(result)
                    .build();
        }
    }

    // ---- helpers ----

    private String computeKpiResultStatus(
            PerformanceCycle cycle, PerformanceReview review, UUID userId) {
        if (cycle.getResultsPublishedAt() == null) return "not_published";
        if (kpiResultConfirmationRepository.findByReviewId(review.getId()).isPresent())
            return "confirmed";
        if (appealRepository.findByReviewId(review.getId()).isPresent()) return "disputed";
        if (cycle.getStatus() == CycleStatus.COMPLETED || cycle.getStatus() == CycleStatus.CLOSED)
            return "finalized";
        return "pending_confirmation";
    }

    private Optional<PerformanceCycle> getCurrentCycleOptional() {
        List<CycleStatus> activeStatuses =
                List.of(
                        CycleStatus.NOT_STARTED,
                        CycleStatus.IN_PROGRESS,
                        CycleStatus.LOCKED,
                        CycleStatus.RESULTS_PUBLISHED,
                        CycleStatus.COMPLETED);
        List<PerformanceCycle> cycles = performanceCycleRepository.findByStatusIn(activeStatuses);
        return cycles.stream()
                .min(
                        Comparator.comparingInt(
                                        (PerformanceCycle c) -> statusPriority(c.getStatus()))
                                .thenComparing(
                                        Comparator.comparing(PerformanceCycle::getUpdatedAt)
                                                .reversed()));
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
        LocalDate startDate =
                cycle.getCycleStart() != null ? cycle.getCycleStart().toLocalDate() : null;
        LocalDate endDate =
                cycle.getHrReviewEnd() != null ? cycle.getHrReviewEnd().toLocalDate() : null;
        String periodLabel =
                (startDate != null && endDate != null) ? startDate + "~" + endDate : null;
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

    private KpiResultSummaryDTO.EmployeeSummaryDTO buildEmployeeSummaryDTO(User user) {
        if (user == null) return null;
        return KpiResultSummaryDTO.EmployeeSummaryDTO.builder()
                .userId(user.getId().toString())
                .name(user.getFullName())
                .build();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}

package com.pms.service.employee.impl;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.appeal.AppealDTO;
import com.pms.dto.employee.appeal.AppealResponsesDTO.*;
import com.pms.dto.employee.kpi.KpiResultSummaryDTO.DisputePeriodDTO;
import com.pms.entity.*;
import com.pms.entity.enums.AppealAssignee;
import com.pms.entity.enums.AppealStatus;
import com.pms.entity.enums.CycleStatus;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.*;
import com.pms.service.employee.EmployeeAppealService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class EmployeeAppealServiceImpl implements EmployeeAppealService {

    private static final UUID HELEN_HO_UUID = UUID.fromString("00000000-0000-0000-0000-0000000000a1");

    private final UserRepository userRepository;
    private final PerformanceCycleRepository performanceCycleRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final AppealRepository appealRepository;
    private final AppealResponseRepository appealResponseRepository;

    @Override
    public AppealsResponseDTO getAppeals(UUID userId) {
        PerformanceCycle cycle = getCurrentCycleOptional()
                .orElseThrow(() -> new NotFoundException("CURRENT_APPEAL_PERIOD_NOT_FOUND", "No current appeal period found"));

        PerformanceReview review = performanceReviewRepository.findByCycleIdAndEmployeeId(cycle.getId(), userId)
                .orElseThrow(() -> new NotFoundException("REVIEW_NOT_FOUND", "No performance review found"));

        Optional<Appeal> appealOpt = appealRepository.findByReviewId(review.getId());

        DisputePeriodDTO appealPeriod = computeAppealPeriod(cycle, appealOpt);

        String mode = appealOpt.isEmpty() ? "compose" : "result";

        AppealDTO currentAppeal = null;
        if (appealOpt.isPresent()) {
            Appeal appeal = appealOpt.get();
            Optional<AppealResponse> latestResponse = appealResponseRepository.findTopByAppealIdOrderByRespondedAtDesc(appeal.getId());
            User handler = userRepository.findById(appeal.getAssignedTo()).orElse(null);
            currentAppeal = buildAppealDTO(appeal, review, cycle, handler, latestResponse.orElse(null));
        }

        AppealReviewResultDTO reviewResult = buildReviewResult(review);

        boolean canStartAppeal = "compose".equals(mode) && "open".equals(appealPeriod.getStatus());
        boolean canSubmit = canStartAppeal;

        return AppealsResponseDTO.builder()
                .mode(mode)
                .period(buildCycleSummaryDTO(cycle))
                .appealPeriod(appealPeriod)
                .reviewResult(reviewResult)
                .currentAppeal(currentAppeal)
                .availableActions(AvailableActionsDTO.builder()
                        .canStartAppeal(canStartAppeal)
                        .startAppealUnavailableReason(canStartAppeal ? null :
                                appealOpt.isPresent() ? "already_submitted" : appealPeriod.getStatus())
                        .canSubmit(canSubmit)
                        .submitUnavailableReason(canSubmit ? null :
                                appealOpt.isPresent() ? "already_submitted" : appealPeriod.getStatus())
                        .build())
                .build();
    }

    @Override
    @Transactional
    public AppealSubmitResponseDTO submitAppeal(UUID userId, AppealSubmitRequestDTO request) {
        UUID cycleId = UUID.fromString(request.getPeriodId());
        PerformanceCycle cycle = performanceCycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("CURRENT_APPEAL_PERIOD_NOT_FOUND", "Performance cycle not found"));

        PerformanceReview review = performanceReviewRepository.findByCycleIdAndEmployeeId(cycle.getId(), userId)
                .orElseThrow(() -> new NotFoundException("REVIEW_NOT_FOUND", "No performance review found"));

        if (!review.getEmployeeId().equals(userId)) {
            throw new ForbiddenException("FORBIDDEN", "You do not have permission to submit an appeal for this review");
        }

        if (cycle.getResultsPublishedAt() == null) {
            throw new ForbiddenException("RESULT_NOT_PUBLISHED", "Results have not been published yet");
        }

        DisputePeriodDTO appealPeriod = computeAppealPeriod(cycle, Optional.empty());
        if ("not_open".equals(appealPeriod.getStatus())) {
            throw new ForbiddenException("APPEAL_PERIOD_NOT_OPEN", "The appeal period is not open yet");
        }
        if ("closed".equals(appealPeriod.getStatus())) {
            throw new ForbiddenException("APPEAL_PERIOD_CLOSED", "The appeal period has closed");
        }

        if (appealRepository.findByReviewId(review.getId()).isPresent()) {
            throw new ConflictException("APPEAL_ALREADY_SUBMITTED", "An appeal has already been submitted for this review");
        }

        if (request.getReason() == null || request.getReason().isBlank() || request.getReason().length() > 2000) {
            throw new ConflictException("INVALID_REASON", "Reason must be between 1 and 2000 characters");
        }

        String caseNo = "DP-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));

        Appeal appeal = Appeal.builder()
                .id(UUID.randomUUID())
                .reviewId(review.getId())
                .caseNo(caseNo)
                .filedBy(userId)
                .assignedToType(AppealAssignee.HR)
                .assignedTo(HELEN_HO_UUID)
                .reason(request.getReason())
                .status(AppealStatus.SUBMITTED)
                .filedAt(OffsetDateTime.now())
                .build();
        appeal = appealRepository.save(appeal);

        User handler = userRepository.findById(HELEN_HO_UUID).orElse(null);
        AppealDTO appealDTO = buildAppealDTO(appeal, review, cycle, handler, null);

        return AppealSubmitResponseDTO.builder()
                .appeal(appealDTO)
                .availableActions(AvailableActionsDTO.builder()
                        .canStartAppeal(false)
                        .startAppealUnavailableReason("already_submitted")
                        .canSubmit(false)
                        .submitUnavailableReason("already_submitted")
                        .build())
                .build();
    }

    @Override
    public AppealResultResponseDTO getAppealResult(UUID userId) {
        PerformanceCycle cycle = getCurrentCycleOptional()
                .orElseThrow(() -> new NotFoundException("CURRENT_APPEAL_PERIOD_NOT_FOUND", "No current appeal period found"));

        PerformanceReview review = performanceReviewRepository.findByCycleIdAndEmployeeId(cycle.getId(), userId)
                .orElseThrow(() -> new NotFoundException("REVIEW_NOT_FOUND", "No performance review found"));

        Appeal appeal = appealRepository.findByReviewId(review.getId())
                .orElseThrow(() -> new NotFoundException("APPEAL_NOT_FOUND", "No appeal found for current review"));

        Optional<AppealResponse> latestResponse = appealResponseRepository.findTopByAppealIdOrderByRespondedAtDesc(appeal.getId());
        User handler = userRepository.findById(appeal.getAssignedTo()).orElse(null);

        AppealDTO appealDTO = buildAppealDTO(appeal, review, cycle, handler, latestResponse.orElse(null));
        AppealReviewResultDTO reviewResult = buildReviewResult(review);

        return AppealResultResponseDTO.builder()
                .appeal(appealDTO)
                .reviewResult(reviewResult)
                .build();
    }

    // ---- helpers ----

    private DisputePeriodDTO computeAppealPeriod(PerformanceCycle cycle, Optional<Appeal> appealOpt) {
        if (cycle.getResultsPublishedAt() == null) {
            return DisputePeriodDTO.builder()
                    .status("not_open")
                    .startDate(null)
                    .endDate(null)
                    .timezone(cycle.getTimezone())
                    .build();
        }
        OffsetDateTime start = cycle.getResultsPublishedAt();
        OffsetDateTime end = start.plusDays(cycle.getAppealDeadlineDays());
        OffsetDateTime now = OffsetDateTime.now();

        String status;
        if (now.isBefore(start)) {
            status = "not_open";
        } else if (!now.isAfter(end) && appealOpt.isEmpty()) {
            status = "open";
        } else {
            status = "closed";
        }

        return DisputePeriodDTO.builder()
                .status(status)
                .startDate(start.toLocalDate().toString())
                .endDate(end.toLocalDate().toString())
                .timezone(cycle.getTimezone())
                .build();
    }

    private AppealDTO buildAppealDTO(Appeal appeal, PerformanceReview review, PerformanceCycle cycle,
                                      User handler, AppealResponse latestResponse) {
        AppealDTO.AppealHandlerDTO handlerDTO = null;
        if (handler != null) {
            handlerDTO = AppealDTO.AppealHandlerDTO.builder()
                    .userId(handler.getId().toString())
                    .type(appeal.getAssignedToType() != null ? appeal.getAssignedToType().getDbValue() : null)
                    .name(handler.getFullName())
                    .englishName(handler.getEnglishName())
                    .build();
        }

        String processingComment = null;
        OffsetDateTime processingCommentUpdatedAt = null;
        boolean isFinalResponse = false;
        if (latestResponse != null) {
            processingComment = latestResponse.getResponseText();
            processingCommentUpdatedAt = latestResponse.getRespondedAt();
            isFinalResponse = Boolean.TRUE.equals(latestResponse.getIsFinal());
        }

        return AppealDTO.builder()
                .appealId(appeal.getId().toString())
                .caseNo(appeal.getCaseNo())
                .reviewId(review.getId().toString())
                .period(buildCycleSummaryDTO(cycle))
                .reason(appeal.getReason())
                .status(appeal.getStatus() != null ? appeal.getStatus().getDbValue() : null)
                .submittedAt(appeal.getFiledAt())
                .resolvedAt(appeal.getResolvedAt())
                .handler(handlerDTO)
                .processingComment(processingComment)
                .processingCommentUpdatedAt(processingCommentUpdatedAt)
                .isFinalResponse(isFinalResponse)
                .updatedAt(appeal.getFiledAt())
                .build();
    }

    private AppealReviewResultDTO buildReviewResult(PerformanceReview review) {
        return AppealReviewResultDTO.builder()
                .reviewId(review.getId().toString())
                .finalRating(review.getFinalRating() != null ? review.getFinalRating().getDbValue() : null)
                .kpiScore(review.getKpiScore() != null ? review.getKpiScore().doubleValue() : null)
                .reviewScore(review.getReviewScore() != null ? review.getReviewScore().doubleValue() : null)
                .managerComment(review.getManagerComment())
                .build();
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

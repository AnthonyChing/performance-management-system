package com.pms.service.employee.impl;

import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.DepartmentDTO;
import com.pms.dto.employee.ManagerDTO;
import com.pms.dto.employee.ProfileDTO;
import com.pms.dto.employee.ReviewSummaryDTO;
import com.pms.dto.employee.profile.CurrentCycleResponseDTO;
import com.pms.dto.employee.profile.ProfileResponseDTO;
import com.pms.entity.Department;
import com.pms.entity.PerformanceCycle;
import com.pms.entity.PerformanceReview;
import com.pms.entity.User;
import com.pms.entity.enums.CycleStatus;
import com.pms.exception.NotFoundException;
import com.pms.repository.DepartmentRepository;
import com.pms.repository.PerformanceCycleRepository;
import com.pms.repository.PerformanceReviewRepository;
import com.pms.repository.UserRepository;
import com.pms.service.employee.EmployeeProfileService;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmployeeProfileServiceImpl implements EmployeeProfileService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PerformanceCycleRepository performanceCycleRepository;
    private final PerformanceReviewRepository performanceReviewRepository;

    @Override
    public ProfileResponseDTO getProfile(UUID userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(
                                () -> new NotFoundException("USER_NOT_FOUND", "User not found"));

        Department department = departmentRepository.findById(user.getDepartmentId()).orElse(null);
        DepartmentDTO departmentDTO =
                department != null
                        ? DepartmentDTO.builder()
                                .departmentId(department.getId().toString())
                                .name(department.getName())
                                .build()
                        : null;

        ManagerDTO managerDTO = null;
        if (user.getManagerId() != null) {
            User manager = userRepository.findById(user.getManagerId()).orElse(null);
            if (manager != null) {
                managerDTO =
                        ManagerDTO.builder()
                                .userId(manager.getId().toString())
                                .name(manager.getFullName())
                                .englishName(manager.getEnglishName())
                                .email(manager.getEmail())
                                .title(manager.getJobTitle())
                                .build();
            }
        }

        ProfileDTO profile =
                ProfileDTO.builder()
                        .userId(user.getId().toString())
                        .employeeId(user.getEmployeeId())
                        .name(user.getFullName())
                        .englishName(user.getEnglishName())
                        .avatarUrl(user.getAvatarUrl())
                        .jobTitle(user.getJobTitle())
                        .jobCategory(user.getJobCategory())
                        .department(departmentDTO)
                        .location(user.getLocation())
                        .email(user.getEmail())
                        .employmentStatus(
                                user.getEmploymentStatus() != null
                                        ? user.getEmploymentStatus().getDbValue()
                                        : null)
                        .terminatedAt(user.getTerminatedAt())
                        .manager(managerDTO)
                        .build();

        Optional<PerformanceCycle> currentCycleOpt = getCurrentCycleOptional();

        CycleSummaryDTO cycleSummaryDTO = null;
        ReviewSummaryDTO reviewSummaryDTO = null;

        if (currentCycleOpt.isPresent()) {
            PerformanceCycle cycle = currentCycleOpt.get();
            cycleSummaryDTO = buildCycleSummaryDTO(cycle);

            Optional<PerformanceReview> reviewOpt =
                    performanceReviewRepository.findByCycleIdAndEmployeeId(cycle.getId(), userId);
            if (reviewOpt.isPresent()) {
                PerformanceReview review = reviewOpt.get();
                ManagerDTO reviewManagerDTO = buildManagerDTO(review.getManagerId());
                ManagerDTO coManagerDTO =
                        review.getCoManagerId() != null
                                ? buildManagerDTO(review.getCoManagerId())
                                : null;
                reviewSummaryDTO =
                        ReviewSummaryDTO.builder()
                                .reviewId(review.getId().toString())
                                .status(
                                        review.getStatus() != null
                                                ? review.getStatus().getDbValue()
                                                : null)
                                .manager(reviewManagerDTO)
                                .coManager(coManagerDTO)
                                .submittedAt(review.getSelfSubmittedAt())
                                .updatedAt(review.getUpdatedAt())
                                .build();
            }
        }

        return ProfileResponseDTO.builder()
                .profile(profile)
                .cycle(cycleSummaryDTO)
                .review(reviewSummaryDTO)
                .build();
    }

    @Override
    public CurrentCycleResponseDTO getCurrentCycle(UUID userId) {
        PerformanceCycle cycle =
                getCurrentCycleOptional()
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "CURRENT_CYCLE_NOT_FOUND", "No current cycle"));

        return CurrentCycleResponseDTO.builder().cycle(buildCycleSummaryDTO(cycle)).build();
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
                .managerEvalStart(cycle.getManagerEvalStart())
                .managerEvalEnd(cycle.getManagerEvalEnd())
                .timezone(cycle.getTimezone())
                .status(cycle.getStatus() != null ? cycle.getStatus().getDbValue() : null)
                .isLocked(cycle.getIsLocked())
                .resultsPublishedAt(cycle.getResultsPublishedAt())
                .updatedAt(cycle.getUpdatedAt())
                .build();
    }

    private ManagerDTO buildManagerDTO(UUID managerId) {
        if (managerId == null) return null;
        return userRepository
                .findById(managerId)
                .map(
                        m ->
                                ManagerDTO.builder()
                                        .userId(m.getId().toString())
                                        .name(m.getFullName())
                                        .englishName(m.getEnglishName())
                                        .email(m.getEmail())
                                        .title(m.getJobTitle())
                                        .build())
                .orElse(null);
    }
}

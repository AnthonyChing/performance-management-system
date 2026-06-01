package com.pms.service.manager.impl;

import com.pms.audit.Auditable;
import com.pms.dto.manager.kpi.ManagerKpiCreateRequestDTO;
import com.pms.dto.manager.kpi.ManagerKpiPatchRequestDTO;
import com.pms.dto.manager.kpi.ManagerKpiResponseDTO;
import com.pms.entity.Kpi;
import com.pms.entity.KpiAssignment;
import com.pms.entity.KpiAssignmentId;
import com.pms.entity.PerformanceCycle;
import com.pms.entity.User;
import com.pms.entity.enums.CycleStatus;
import com.pms.entity.enums.GoalType;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.KpiAssignmentRepository;
import com.pms.repository.KpiRepository;
import com.pms.repository.PerformanceCycleRepository;
import com.pms.repository.UserRepository;
import com.pms.service.manager.ManagerKpiService;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerKpiServiceImpl implements ManagerKpiService {

    private final KpiRepository kpiRepo;
    private final KpiAssignmentRepository kpiAssignmentRepo;
    private final UserRepository userRepo;
    private final PerformanceCycleRepository cycleRepo;

    @Override
    @Transactional
    @Auditable(action = "CREATE_KPI", resource = "kpi", resourceIdFrom = "return.id")
    public ManagerKpiResponseDTO createKpi(
            UUID managerId, UUID subordinateId, ManagerKpiCreateRequestDTO req) {
        assertDirectSubordinate(managerId, subordinateId);
        PerformanceCycle cycle = getCurrentCycle();
        assertNotLocked(cycle);

        GoalType type =
                req.getKpiType() != null ? parseGoalType(req.getKpiType()) : GoalType.INDIVIDUAL;
        Kpi kpi =
                Kpi.builder()
                        .id(UUID.randomUUID())
                        .cycleId(cycle.getId())
                        .createdBy(managerId)
                        .kpiType(type)
                        .title(req.getTitle())
                        .description(req.getDescription())
                        .unit(req.getUnit())
                        .targetOperator(req.getTargetOperator())
                        .targetValue(req.getTargetValue())
                        .targetUnit(req.getTargetUnit())
                        .targetDisplayText(req.getTargetDisplayText())
                        .build();
        kpiRepo.save(kpi);

        BigDecimal weight = req.getWeight() != null ? req.getWeight() : BigDecimal.ZERO;
        KpiAssignment assignment =
                KpiAssignment.builder()
                        .kpiId(kpi.getId())
                        .userId(subordinateId)
                        .weight(weight)
                        .targetValue(req.getTargetValue())
                        .build();
        kpiAssignmentRepo.save(assignment);

        return ManagerKpiResponseDTO.from(kpi, assignment);
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_KPI", resource = "kpi", resourceIdFrom = "kpiId")
    public ManagerKpiResponseDTO patchKpi(
            UUID managerId, UUID subordinateId, UUID kpiId, ManagerKpiPatchRequestDTO req) {
        assertDirectSubordinate(managerId, subordinateId);
        Kpi kpi =
                kpiRepo.findById(kpiId)
                        .filter(k -> k.getDeletedAt() == null)
                        .orElseThrow(
                                () -> new NotFoundException("RESOURCE_NOT_FOUND", "KPI not found"));
        PerformanceCycle cycle =
                cycleRepo
                        .findById(kpi.getCycleId())
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Cycle not found"));
        assertNotLocked(cycle);

        KpiAssignment assignment =
                kpiAssignmentRepo
                        .findById(new KpiAssignmentId(kpiId, subordinateId))
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "KPI assignment not found"));

        if (req.getTitle() != null) kpi.setTitle(req.getTitle());
        if (req.getDescription() != null) kpi.setDescription(req.getDescription());
        if (req.getUnit() != null) kpi.setUnit(req.getUnit());
        if (req.getKpiType() != null) kpi.setKpiType(parseGoalType(req.getKpiType()));
        if (req.getTargetOperator() != null) kpi.setTargetOperator(req.getTargetOperator());
        if (req.getTargetValue() != null) kpi.setTargetValue(req.getTargetValue());
        if (req.getTargetUnit() != null) kpi.setTargetUnit(req.getTargetUnit());
        if (req.getTargetDisplayText() != null)
            kpi.setTargetDisplayText(req.getTargetDisplayText());
        kpiRepo.save(kpi);

        if (req.getTargetValue() != null) assignment.setTargetValue(req.getTargetValue());
        if (req.getCurrentValue() != null) assignment.setCurrentValue(req.getCurrentValue());
        if (req.getWeight() != null) assignment.setWeight(req.getWeight());
        kpiAssignmentRepo.save(assignment);

        return ManagerKpiResponseDTO.from(kpi, assignment);
    }

    @Override
    public List<ManagerKpiResponseDTO> listKpis(
            UUID managerId, UUID subordinateId, String cycleId) {
        assertDirectSubordinate(managerId, subordinateId);
        List<Kpi> kpis = kpiRepo.findByUserIdAndOptionalCycle(subordinateId, cycleId);
        return kpis.stream()
                .map(
                        kpi -> {
                            KpiAssignment assignment =
                                    kpiAssignmentRepo
                                            .findById(
                                                    new KpiAssignmentId(kpi.getId(), subordinateId))
                                            .orElse(null);
                            return ManagerKpiResponseDTO.from(kpi, assignment);
                        })
                .toList();
    }

    @Override
    @Transactional
    @Auditable(action = "DELETE_KPI", resource = "kpi", resourceIdFrom = "kpiId")
    public void deleteKpi(UUID managerId, UUID subordinateId, UUID kpiId) {
        assertDirectSubordinate(managerId, subordinateId);
        Kpi kpi =
                kpiRepo.findById(kpiId)
                        .filter(k -> k.getDeletedAt() == null)
                        .orElseThrow(
                                () -> new NotFoundException("RESOURCE_NOT_FOUND", "KPI not found"));
        PerformanceCycle cycle =
                cycleRepo
                        .findById(kpi.getCycleId())
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Cycle not found"));
        assertNotLocked(cycle);

        kpi.setDeletedAt(OffsetDateTime.now());
        kpiRepo.save(kpi);
    }

    private void assertDirectSubordinate(UUID managerId, UUID subordinateId) {
        User sub =
                userRepo.findById(subordinateId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "SUBORDINATE_NOT_FOUND", "Employee not found"));
        if (!managerId.equals(sub.getManagerId())) {
            throw new ForbiddenException("FORBIDDEN", "You do not manage this employee");
        }
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
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid kpi_type: " + value);
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

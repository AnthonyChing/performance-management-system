package com.pms.service.hr.impl;

import com.pms.audit.Auditable;
import com.pms.dto.hr.cycle.CycleCreateRequestDTO;
import com.pms.dto.hr.cycle.CyclePatchRequestDTO;
import com.pms.dto.hr.cycle.CyclePatchStatusRequestDTO;
import com.pms.dto.hr.cycle.CycleResponseDTO;
import com.pms.entity.PerformanceCycle;
import com.pms.entity.enums.CycleStatus;
import com.pms.entity.enums.CycleType;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.NotFoundException;
import com.pms.repository.PerformanceCycleRepository;
import com.pms.service.hr.HrCycleService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HrCycleServiceImpl implements HrCycleService {

    private final PerformanceCycleRepository cycleRepo;

    private static final java.util.Set<CycleStatus> MODIFIABLE_STATUSES =
            java.util.Set.of(CycleStatus.NOT_STARTED, CycleStatus.IN_PROGRESS);

    @Override
    @Transactional
    @Auditable(action = "CREATE_CYCLE", resource = "performance_cycle")
    public CycleResponseDTO createCycle(UUID actorId, CycleCreateRequestDTO req) {
        CycleType type = parseCycleType(req.getCycleType());
        PerformanceCycle cycle =
                PerformanceCycle.builder()
                        .id(UUID.randomUUID())
                        .name(req.getName())
                        .cycleType(type)
                        .status(CycleStatus.NOT_STARTED)
                        .timezone(req.getTimezone() != null ? req.getTimezone() : "Asia/Taipei")
                        .cycleStart(req.getCycleStart())
                        .cycleEnd(req.getCycleEnd())
                        .managerEvalStart(req.getManagerEvalStart())
                        .managerEvalEnd(req.getManagerEvalEnd())
                        .hrReviewEnd(req.getHrReviewEnd())
                        .appealDeadlineDays(
                                req.getAppealDeadlineDays() != null
                                        ? req.getAppealDeadlineDays()
                                        : 7)
                        .isLocked(false)
                        .createdBy(actorId)
                        .build();
        cycleRepo.save(cycle);
        return CycleResponseDTO.from(cycle);
    }

    @Override
    public Page<CycleResponseDTO> listCycles(String status, int page, int pageSize) {
        return cycleRepo
                .findAllFiltered(status, PageRequest.of(page - 1, pageSize))
                .map(CycleResponseDTO::from);
    }

    @Override
    public CycleResponseDTO getCycle(UUID cycleId) {
        return CycleResponseDTO.from(findCycle(cycleId));
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_CYCLE", resource = "performance_cycle", resourceIdFrom = "cycleId")
    public CycleResponseDTO patchCycle(UUID actorId, UUID cycleId, CyclePatchRequestDTO req) {
        PerformanceCycle cycle = findCycle(cycleId);
        if (!MODIFIABLE_STATUSES.contains(cycle.getStatus())) {
            throw new ConflictException(
                    "STATE_CONFLICT",
                    "Cannot modify a cycle in status: " + cycle.getStatus().getDbValue());
        }
        if (req.getName() != null) {
            cycle.setName(req.getName());
        }
        if (req.getTimezone() != null) {
            cycle.setTimezone(req.getTimezone());
        }
        if (req.getCycleStart() != null) {
            cycle.setCycleStart(req.getCycleStart());
        }
        if (req.getCycleEnd() != null) {
            cycle.setCycleEnd(req.getCycleEnd());
        }
        if (req.getManagerEvalStart() != null) {
            cycle.setManagerEvalStart(req.getManagerEvalStart());
        }
        if (req.getManagerEvalEnd() != null) {
            cycle.setManagerEvalEnd(req.getManagerEvalEnd());
        }
        if (req.getHrReviewEnd() != null) {
            cycle.setHrReviewEnd(req.getHrReviewEnd());
        }
        if (req.getAppealDeadlineDays() != null) {
            cycle.setAppealDeadlineDays(req.getAppealDeadlineDays());
        }
        cycleRepo.save(cycle);
        return CycleResponseDTO.from(cycle);
    }

    @Override
    @Transactional
    @Auditable(
            action = "UPDATE_CYCLE_STATUS",
            resource = "performance_cycle",
            resourceIdFrom = "cycleId")
    public CycleResponseDTO patchCycleStatus(UUID cycleId, CyclePatchStatusRequestDTO req) {
        PerformanceCycle cycle = findCycle(cycleId);
        CycleStatus newStatus = parseCycleStatus(req.getStatus());
        if (cycle.getStatus() == newStatus) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Cycle is already in status: " + newStatus.getDbValue());
        }
        cycle.setStatus(newStatus);
        if (newStatus == CycleStatus.LOCKED) {
            cycle.setIsLocked(true);
        } else if (newStatus == CycleStatus.RESULTS_PUBLISHED) {
            cycle.setResultsPublishedAt(java.time.OffsetDateTime.now());
        }
        cycleRepo.save(cycle);
        return CycleResponseDTO.from(cycle);
    }

    private PerformanceCycle findCycle(UUID cycleId) {
        return cycleRepo
                .findById(cycleId)
                .orElseThrow(
                        () ->
                                new NotFoundException(
                                        "RESOURCE_NOT_FOUND", "Performance cycle not found"));
    }

    private CycleType parseCycleType(String value) {
        try {
            return CycleType.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid cycle_type: " + value);
        }
    }

    private CycleStatus parseCycleStatus(String value) {
        try {
            return CycleStatus.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid status: " + value);
        }
    }
}

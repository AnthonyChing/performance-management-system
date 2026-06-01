package com.pms.service.employee.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.pms.dto.employee.kpi.KpiResponsesDTO.KpiStandardsResponseDTO;
import com.pms.entity.Kpi;
import com.pms.entity.KpiAssignment;
import com.pms.entity.PerformanceCycle;
import com.pms.entity.PerformanceReview;
import com.pms.entity.enums.CycleStatus;
import com.pms.exception.NotFoundException;
import com.pms.repository.AppealRepository;
import com.pms.repository.KpiAssignmentRepository;
import com.pms.repository.KpiProgressSnapshotRepository;
import com.pms.repository.KpiRepository;
import com.pms.repository.KpiResultConfirmationRepository;
import com.pms.repository.PerformanceCycleRepository;
import com.pms.repository.PerformanceReviewRepository;
import com.pms.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EmployeeKpiServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PerformanceCycleRepository performanceCycleRepository;
    @Mock private PerformanceReviewRepository performanceReviewRepository;
    @Mock private KpiRepository kpiRepository;
    @Mock private KpiAssignmentRepository kpiAssignmentRepository;
    @Mock private KpiProgressSnapshotRepository kpiProgressSnapshotRepository;
    @Mock private KpiResultConfirmationRepository kpiResultConfirmationRepository;
    @Mock private AppealRepository appealRepository;

    @InjectMocks private EmployeeKpiServiceImpl service;

    private UUID userId;
    private UUID cycleId;
    private PerformanceCycle cycle;
    private PerformanceReview review;
    private Kpi kpi;
    private KpiAssignment assignment;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        cycleId = UUID.randomUUID();
        cycle = new PerformanceCycle();
        cycle.setId(cycleId);
        cycle.setStatus(CycleStatus.IN_PROGRESS);
        cycle.setCycleType(com.pms.entity.enums.CycleType.QUARTERLY);
        cycle.setName("Test Cycle");

        review = new PerformanceReview();
        review.setId(UUID.randomUUID());
        review.setCycleId(cycleId);
        review.setEmployeeId(userId);

        kpi = new Kpi();
        kpi.setId(UUID.randomUUID());
        kpi.setCycleId(cycleId);
        kpi.setTitle("Test KPI");

        assignment = new KpiAssignment();
        assignment.setUserId(userId);
        assignment.setKpiId(kpi.getId());
        assignment.setWeight(new BigDecimal("1.0"));
    }

    @Test
    void getKpiStandards_success() {
        when(performanceCycleRepository.findByStatusIn(any())).thenReturn(List.of(cycle));
        when(performanceReviewRepository.findByCycleIdAndEmployeeId(cycleId, userId))
                .thenReturn(Optional.of(review));
        when(kpiRepository.findByCycleIdAndDeletedAtIsNull(cycleId)).thenReturn(List.of(kpi));
        when(kpiAssignmentRepository.findByUserIdAndKpiIdIn(eq(userId), any()))
                .thenReturn(List.of(assignment));

        KpiStandardsResponseDTO res = service.getKpiStandards(userId);
        assertNotNull(res);
        assertNotNull(res.getStandards());
        assertEquals(1, res.getStandards().size());
        assertEquals(kpi.getId().toString(), res.getStandards().get(0).getKpiId());
    }

    @Test
    void getKpiStandards_noCycleFound() {
        when(performanceCycleRepository.findByStatusIn(any())).thenReturn(List.of());

        assertThrows(NotFoundException.class, () -> service.getKpiStandards(userId));
    }

    @Test
    void getKpiResult_success() {
        when(performanceCycleRepository.findByStatusIn(any())).thenReturn(List.of(cycle));
        when(performanceReviewRepository.findByCycleIdAndEmployeeId(cycleId, userId))
                .thenReturn(Optional.of(review));
        when(kpiRepository.findByCycleIdAndDeletedAtIsNull(cycleId)).thenReturn(List.of(kpi));
        when(kpiAssignmentRepository.findByUserIdAndKpiIdIn(eq(userId), any()))
                .thenReturn(List.of(assignment));

        var res = service.getKpiResult(userId);
        assertNotNull(res);
        assertEquals(cycleId.toString(), res.getResult().getCycle().getCycleId());
    }

    @Test
    void getKpiResult_noCycleFound() {
        when(performanceCycleRepository.findByStatusIn(any())).thenReturn(List.of());

        assertThrows(NotFoundException.class, () -> service.getKpiResult(userId));
    }
}

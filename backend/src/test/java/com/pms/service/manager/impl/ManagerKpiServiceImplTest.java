package com.pms.service.manager.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

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
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.repository.KpiAssignmentRepository;
import com.pms.repository.KpiRepository;
import com.pms.repository.PerformanceCycleRepository;
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
class ManagerKpiServiceImplTest {

    @Mock private KpiRepository kpiRepo;
    @Mock private KpiAssignmentRepository kpiAssignmentRepo;
    @Mock private UserRepository userRepo;
    @Mock private PerformanceCycleRepository cycleRepo;

    @InjectMocks private ManagerKpiServiceImpl service;

    private UUID managerId;
    private UUID subordinateId;
    private UUID kpiId;
    private User subordinate;
    private PerformanceCycle cycle;
    private Kpi kpi;
    private KpiAssignment assignment;

    @BeforeEach
    void setUp() {
        managerId = UUID.randomUUID();
        subordinateId = UUID.randomUUID();
        kpiId = UUID.randomUUID();

        subordinate = new User();
        subordinate.setId(subordinateId);
        subordinate.setManagerId(managerId);

        cycle = new PerformanceCycle();
        cycle.setId(UUID.randomUUID());
        cycle.setStatus(CycleStatus.IN_PROGRESS);
        cycle.setIsLocked(false);

        kpi = new Kpi();
        kpi.setId(kpiId);
        kpi.setCycleId(cycle.getId());
        kpi.setTitle("Test KPI");
        kpi.setKpiType(GoalType.INDIVIDUAL);

        assignment = new KpiAssignment();
        assignment.setKpiId(kpiId);
        assignment.setUserId(subordinateId);
        assignment.setTargetValue(new BigDecimal("100.0"));
    }

    @Test
    void createKpi_success() {
        when(userRepo.findById(subordinateId)).thenReturn(Optional.of(subordinate));
        when(cycleRepo.findByStatusIn(any())).thenReturn(List.of(cycle));

        ManagerKpiCreateRequestDTO req = new ManagerKpiCreateRequestDTO();
        req.setTitle("New KPI");
        req.setTargetValue(new BigDecimal("100.0"));

        ManagerKpiResponseDTO res = service.createKpi(managerId, subordinateId, req);

        assertNotNull(res);
        assertEquals("New KPI", res.getTitle());
        verify(kpiRepo).save(any(Kpi.class));
        verify(kpiAssignmentRepo).save(any(KpiAssignment.class));
    }

    @Test
    void patchKpi_success() {
        when(userRepo.findById(subordinateId)).thenReturn(Optional.of(subordinate));
        when(kpiRepo.findById(kpiId)).thenReturn(Optional.of(kpi));
        when(cycleRepo.findById(cycle.getId())).thenReturn(Optional.of(cycle));
        when(kpiAssignmentRepo.findById(new KpiAssignmentId(kpiId, subordinateId)))
                .thenReturn(Optional.of(assignment));

        ManagerKpiPatchRequestDTO req = new ManagerKpiPatchRequestDTO();
        req.setTitle("Updated Title");
        req.setCurrentValue(new BigDecimal("50.0"));

        ManagerKpiResponseDTO res = service.patchKpi(managerId, subordinateId, kpiId, req);

        assertNotNull(res);
        assertEquals("Updated Title", res.getTitle());
        assertEquals(new BigDecimal("50.0"), res.getAssignment().getCurrentValue());
        verify(kpiRepo).save(any(Kpi.class));
        verify(kpiAssignmentRepo).save(any(KpiAssignment.class));
    }

    @Test
    void listKpis_success() {
        when(userRepo.findById(subordinateId)).thenReturn(Optional.of(subordinate));
        when(kpiRepo.findByUserIdAndOptionalCycle(eq(subordinateId), any()))
                .thenReturn(List.of(kpi));
        when(kpiAssignmentRepo.findById(new KpiAssignmentId(kpiId, subordinateId)))
                .thenReturn(Optional.of(assignment));

        List<ManagerKpiResponseDTO> res = service.listKpis(managerId, subordinateId, null);

        assertNotNull(res);
        assertEquals(1, res.size());
        assertEquals(kpiId, res.get(0).getId());
    }

    @Test
    void deleteKpi_success() {
        when(userRepo.findById(subordinateId)).thenReturn(Optional.of(subordinate));
        when(kpiRepo.findById(kpiId)).thenReturn(Optional.of(kpi));
        when(cycleRepo.findById(cycle.getId())).thenReturn(Optional.of(cycle));

        service.deleteKpi(managerId, subordinateId, kpiId);

        assertNotNull(kpi.getDeletedAt());
        verify(kpiRepo).save(kpi);
    }

    @Test
    void assertDirectSubordinate_forbidden() {
        subordinate.setManagerId(UUID.randomUUID()); // Different manager
        when(userRepo.findById(subordinateId)).thenReturn(Optional.of(subordinate));

        assertThrows(
                ForbiddenException.class, () -> service.listKpis(managerId, subordinateId, null));
    }

    @Test
    void assertNotLocked_conflict() {
        when(userRepo.findById(subordinateId)).thenReturn(Optional.of(subordinate));
        when(kpiRepo.findById(kpiId)).thenReturn(Optional.of(kpi));

        cycle.setIsLocked(true);
        when(cycleRepo.findById(cycle.getId())).thenReturn(Optional.of(cycle));

        ManagerKpiPatchRequestDTO req = new ManagerKpiPatchRequestDTO();
        assertThrows(
                ConflictException.class,
                () -> service.patchKpi(managerId, subordinateId, kpiId, req));
    }
}

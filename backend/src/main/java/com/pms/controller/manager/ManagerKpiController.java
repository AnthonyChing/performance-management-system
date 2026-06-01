package com.pms.controller.manager;

import com.pms.dto.manager.kpi.ManagerKpiCreateRequestDTO;
import com.pms.dto.manager.kpi.ManagerKpiPatchRequestDTO;
import com.pms.dto.manager.kpi.ManagerKpiResponseDTO;
import com.pms.security.SecurityUtils;
import com.pms.service.manager.ManagerKpiService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/{userId}/kpis")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerKpiController {

    private final ManagerKpiService kpiService;

    @PostMapping
    public ResponseEntity<Map<String, List<ManagerKpiResponseDTO>>> createKpi(
            @PathVariable UUID userId, @Valid @RequestBody ManagerKpiCreateRequestDTO req) {
        ManagerKpiResponseDTO created =
                kpiService.createKpi(SecurityUtils.currentUserId(), userId, req);
        return ResponseEntity.status(201).body(Map.of("data", List.of(created)));
    }

    @PatchMapping("/{kpiId}")
    public ResponseEntity<ManagerKpiResponseDTO> patchKpi(
            @PathVariable UUID userId,
            @PathVariable UUID kpiId,
            @RequestBody ManagerKpiPatchRequestDTO req) {
        return ResponseEntity.ok(
                kpiService.patchKpi(SecurityUtils.currentUserId(), userId, kpiId, req));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<ManagerKpiResponseDTO>>> listKpis(
            @PathVariable UUID userId,
            @RequestParam(name = "cycle_id", required = false) String cycleId) {
        return ResponseEntity.ok(
                Map.of(
                        "data",
                        kpiService.listKpis(SecurityUtils.currentUserId(), userId, cycleId)));
    }

    @DeleteMapping("/{kpiId}")
    public ResponseEntity<Void> deleteKpi(@PathVariable UUID userId, @PathVariable UUID kpiId) {
        kpiService.deleteKpi(SecurityUtils.currentUserId(), userId, kpiId);
        return ResponseEntity.noContent().build();
    }
}

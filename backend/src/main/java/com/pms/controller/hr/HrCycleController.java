package com.pms.controller.hr;

import com.pms.dto.hr.cycle.CycleCreateRequestDTO;
import com.pms.dto.hr.cycle.CyclePatchRequestDTO;
import com.pms.dto.hr.cycle.CyclePatchStatusRequestDTO;
import com.pms.dto.hr.cycle.CycleResponseDTO;
import com.pms.security.SecurityUtils;
import com.pms.service.hr.HrCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hr/performance-cycles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrCycleController {

    private final HrCycleService cycleService;

    @PostMapping
    public ResponseEntity<CycleResponseDTO> createCycle(@Valid @RequestBody CycleCreateRequestDTO req) {
        CycleResponseDTO created = cycleService.createCycle(SecurityUtils.currentUserId(), req);
        return ResponseEntity.created(URI.create("/api/v1/hr/performance-cycles/" + created.getId())).body(created);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listCycles(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize) {
        Page<CycleResponseDTO> result = cycleService.listCycles(status, page, pageSize);
        return ResponseEntity.ok(Map.of(
                "data", result.getContent(),
                "meta", Map.of(
                        "current_page", result.getNumber() + 1,
                        "total_pages", result.getTotalPages(),
                        "total_count", result.getTotalElements())));
    }

    @GetMapping("/{cycleId}")
    public ResponseEntity<CycleResponseDTO> getCycle(@PathVariable UUID cycleId) {
        return ResponseEntity.ok(cycleService.getCycle(cycleId));
    }

    @PatchMapping("/{cycleId}")
    public ResponseEntity<CycleResponseDTO> patchCycle(
            @PathVariable UUID cycleId,
            @RequestBody CyclePatchRequestDTO req) {
        return ResponseEntity.ok(cycleService.patchCycle(SecurityUtils.currentUserId(), cycleId, req));
    }

    @PatchMapping("/{cycleId}/status")
    public ResponseEntity<CycleResponseDTO> patchCycleStatus(
            @PathVariable UUID cycleId,
            @Valid @RequestBody CyclePatchStatusRequestDTO req) {
        return ResponseEntity.ok(cycleService.patchCycleStatus(cycleId, req));
    }
}

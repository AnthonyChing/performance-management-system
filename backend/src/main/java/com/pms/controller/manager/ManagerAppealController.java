package com.pms.controller.manager;

import com.pms.dto.manager.appeal.ManagerAppealDetailDTO;
import com.pms.dto.manager.appeal.ManagerAppealListItemDTO;
import com.pms.dto.manager.appeal.ManagerAppealPatchRequestDTO;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.UserRepository;
import com.pms.security.SecurityUtils;
import com.pms.service.manager.ManagerAppealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/appeals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerAppealController {

    private final ManagerAppealService appealService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, List<ManagerAppealListItemDTO>>> listAppeals(
            @PathVariable UUID teamId,
            @RequestParam(required = false) String status) {
        assertTeamOwnership(teamId);
        return ResponseEntity.ok(Map.of("data", appealService.listAppeals(teamId, status)));
    }

    @GetMapping("/{appealId}")
    public ResponseEntity<ManagerAppealDetailDTO> getAppeal(
            @PathVariable UUID teamId,
            @PathVariable UUID appealId) {
        assertTeamOwnership(teamId);
        return ResponseEntity.ok(appealService.getAppeal(teamId, appealId));
    }

    @PatchMapping("/{appealId}")
    public ResponseEntity<ManagerAppealDetailDTO> handleAppeal(
            @PathVariable UUID teamId,
            @PathVariable UUID appealId,
            @Valid @RequestBody ManagerAppealPatchRequestDTO req) {
        assertTeamOwnership(teamId);
        return ResponseEntity.ok(appealService.handleAppeal(SecurityUtils.currentUserId(), teamId, appealId, req));
    }

    private void assertTeamOwnership(UUID teamId) {
        UUID currentUserId = SecurityUtils.currentUserId();
        if (currentUserId.equals(teamId)) return;
        userRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Team not found"));
        throw new ForbiddenException("FORBIDDEN", "You can only access your own team");
    }
}

package com.pms.controller.manager;

import com.pms.dto.manager.goal.ManagerGoalCreateRequestDTO;
import com.pms.dto.manager.goal.ManagerGoalPatchRequestDTO;
import com.pms.dto.manager.goal.ManagerGoalResponseDTO;
import com.pms.security.SecurityUtils;
import com.pms.service.manager.ManagerGoalService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/{userId}/goals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerGoalController {

    private final ManagerGoalService goalService;

    @PostMapping
    public ResponseEntity<ManagerGoalResponseDTO> createGoal(
            @PathVariable UUID userId, @Valid @RequestBody ManagerGoalCreateRequestDTO req) {
        ManagerGoalResponseDTO created =
                goalService.createGoal(SecurityUtils.currentUserId(), userId, req);
        return ResponseEntity.created(
                        URI.create("/api/v1/users/" + userId + "/goals/" + created.getGoalId()))
                .body(created);
    }

    @PatchMapping("/{goalId}")
    public ResponseEntity<ManagerGoalResponseDTO> patchGoal(
            @PathVariable UUID userId,
            @PathVariable UUID goalId,
            @RequestBody ManagerGoalPatchRequestDTO req) {
        return ResponseEntity.ok(
                goalService.patchGoal(SecurityUtils.currentUserId(), userId, goalId, req));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<ManagerGoalResponseDTO>>> listGoals(
            @PathVariable UUID userId,
            @RequestParam(name = "cycle_id", required = false) String cycleId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                Map.of(
                        "data",
                        goalService.listGoals(
                                SecurityUtils.currentUserId(), userId, cycleId, status)));
    }
}

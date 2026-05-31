package com.pms.controller.manager;

import com.pms.dto.manager.goal.ManagerGoalResponseDTO;
import com.pms.entity.User;
import com.pms.repository.UserRepository;
import com.pms.security.SecurityUtils;
import com.pms.service.manager.ManagerGoalService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerDashboardController {

    private final ManagerGoalService goalService;
    private final UserRepository userRepository;

    @GetMapping("/subordinates-goals")
    public ResponseEntity<Map<String, List<ManagerGoalResponseDTO>>> listAllSubordinateGoals(
            @RequestParam(name = "cycle_id", required = false) String cycleId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                Map.of(
                        "data",
                        goalService.listAllSubordinateGoals(
                                SecurityUtils.currentUserId(), cycleId, status)));
    }

    @GetMapping("/subordinates")
    public ResponseEntity<Map<String, List<Map<String, String>>>> listSubordinates() {
        List<User> subordinates = userRepository.findByManagerId(SecurityUtils.currentUserId());
        List<Map<String, String>> result =
                subordinates.stream()
                        .map(
                                u ->
                                        Map.of(
                                                "id", u.getId().toString(),
                                                "name", u.getFullName(),
                                                "email", u.getEmail() != null ? u.getEmail() : "",
                                                "department",
                                                        u.getDepartmentId() != null
                                                                ? u.getDepartmentId().toString()
                                                                : "",
                                                "job_title",
                                                        u.getJobTitle() != null
                                                                ? u.getJobTitle()
                                                                : ""))
                        .toList();
        return ResponseEntity.ok(Map.of("data", result));
    }
}

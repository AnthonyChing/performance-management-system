package com.pms.controller.manager;

import com.pms.dto.manager.evaluation.ManagerEvaluationResponseDTO;
import com.pms.dto.manager.evaluation.ManagerEvaluationUpdateRequestDTO;
import com.pms.dto.manager.evaluation.ManagerKpiEvaluationUpdateRequestDTO;
import com.pms.dto.manager.evaluation.ManagerQuestionnaireResponseDTO;
import com.pms.dto.manager.evaluation.ManagerQuestionnaireUpdateRequestDTO;
import com.pms.security.SecurityUtils;
import com.pms.service.manager.ManagerEvaluationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/{userId}/evaluations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerEvaluationController {

    private final ManagerEvaluationService evaluationService;

    @GetMapping
    public ResponseEntity<Map<String, List<ManagerEvaluationResponseDTO>>> listEvaluations(
            @PathVariable UUID userId,
            @RequestParam(name = "cycle_id", required = false) String cycleId) {
        return ResponseEntity.ok(
                Map.of(
                        "data",
                        evaluationService.listEvaluations(
                                SecurityUtils.currentUserId(), userId, cycleId)));
    }

    @PatchMapping("/{evaluationId}")
    public ResponseEntity<ManagerEvaluationResponseDTO> updateEvaluation(
            @PathVariable UUID userId,
            @PathVariable UUID evaluationId,
            @RequestBody ManagerEvaluationUpdateRequestDTO req) {
        return ResponseEntity.ok(
                evaluationService.updateEvaluation(
                        SecurityUtils.currentUserId(), userId, evaluationId, req));
    }

    @GetMapping("/{evaluationId}/questionnaire")
    public ResponseEntity<ManagerQuestionnaireResponseDTO> getQuestionnaire(
            @PathVariable UUID userId, @PathVariable UUID evaluationId) {
        return ResponseEntity.ok(
                evaluationService.getQuestionnaire(
                        SecurityUtils.currentUserId(), userId, evaluationId));
    }

    @PatchMapping("/{evaluationId}/questionnaire")
    public ResponseEntity<ManagerQuestionnaireResponseDTO> updateQuestionnaire(
            @PathVariable UUID userId,
            @PathVariable UUID evaluationId,
            @Valid @RequestBody ManagerQuestionnaireUpdateRequestDTO req) {
        return ResponseEntity.ok(
                evaluationService.updateQuestionnaire(
                        SecurityUtils.currentUserId(), userId, evaluationId, req));
    }

    @PatchMapping("/{evaluationId}/kpis")
    public ResponseEntity<ManagerEvaluationResponseDTO> updateKpiEvaluation(
            @PathVariable UUID userId,
            @PathVariable UUID evaluationId,
            @RequestBody ManagerKpiEvaluationUpdateRequestDTO req) {
        return ResponseEntity.ok(
                evaluationService.updateKpiEvaluation(
                        SecurityUtils.currentUserId(), userId, evaluationId, req));
    }
}

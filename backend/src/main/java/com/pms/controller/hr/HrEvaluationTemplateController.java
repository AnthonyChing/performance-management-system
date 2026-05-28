package com.pms.controller.hr;

import com.pms.dto.hr.evaluation.CreateEvaluationTemplateRequest;
import com.pms.dto.hr.evaluation.EvaluationTemplateListItemResponse;
import com.pms.dto.hr.evaluation.EvaluationTemplateResponse;
import com.pms.dto.hr.evaluation.PatchEvaluationTemplateRequest;
import com.pms.security.SecurityUtils;
import com.pms.service.hr.HrEvaluationTemplateService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/evaluation-templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrEvaluationTemplateController {

    private final HrEvaluationTemplateService evalTemplateService;

    @PostMapping
    public ResponseEntity<EvaluationTemplateResponse> create(
            @Valid @RequestBody CreateEvaluationTemplateRequest req) {
        EvaluationTemplateResponse created =
                evalTemplateService.createEvaluationTemplate(SecurityUtils.currentUserId(), req);
        return ResponseEntity.created(
                        URI.create("/api/v1/hr/evaluation-templates/" + created.getTemplateId()))
                .body(created);
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<EvaluationTemplateResponse> get(@PathVariable UUID templateId) {
        return ResponseEntity.ok(evalTemplateService.getEvaluationTemplate(templateId));
    }

    @PatchMapping("/{templateId}")
    public ResponseEntity<EvaluationTemplateResponse> patch(
            @PathVariable UUID templateId, @Valid @RequestBody PatchEvaluationTemplateRequest req) {
        return ResponseEntity.ok(
                evalTemplateService.patchEvaluationTemplate(
                        SecurityUtils.currentUserId(), templateId, req));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String status,
            @RequestParam(name = "cycle_id", required = false) UUID cycleId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize) {
        Page<EvaluationTemplateListItemResponse> result =
                evalTemplateService.listEvaluationTemplates(page, pageSize, status, cycleId, q);
        return ResponseEntity.ok(
                Map.of(
                        "data", result.getContent(),
                        "meta",
                                Map.of(
                                        "current_page", result.getNumber() + 1,
                                        "total_pages", result.getTotalPages(),
                                        "total_count", result.getTotalElements())));
    }
}

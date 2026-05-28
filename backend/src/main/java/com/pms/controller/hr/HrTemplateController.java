package com.pms.controller.hr;

import com.pms.dto.hr.template.*;
import com.pms.security.SecurityUtils;
import com.pms.service.hr.HrTemplateService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/assessment-templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrTemplateController {

    private final HrTemplateService templateService;

    @PostMapping
    public ResponseEntity<TemplateResponseDTO> createTemplate(
            @Valid @RequestBody TemplateCreateRequestDTO req) {
        TemplateResponseDTO created =
                templateService.createTemplate(SecurityUtils.currentUserId(), req);
        return ResponseEntity.created(
                        URI.create("/api/v1/hr/assessment-templates/" + created.getId()))
                .body(created);
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<TemplateResponseDTO> getTemplate(@PathVariable UUID templateId) {
        return ResponseEntity.ok(templateService.getTemplate(templateId));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listTemplates(
            @RequestParam(required = false) String status,
            @RequestParam(name = "job_category", required = false) String jobCategory,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize) {
        Page<TemplateListItemDTO> result =
                templateService.listTemplates(status, jobCategory, page, pageSize);
        return ResponseEntity.ok(
                Map.of(
                        "data", result.getContent(),
                        "meta",
                                Map.of(
                                        "current_page", result.getNumber() + 1,
                                        "total_pages", result.getTotalPages(),
                                        "total_count", result.getTotalElements())));
    }

    @PatchMapping("/{templateId}")
    public ResponseEntity<TemplateResponseDTO> patchTemplate(
            @PathVariable UUID templateId, @RequestBody TemplatePatchRequestDTO req) {
        return ResponseEntity.ok(
                templateService.patchTemplate(SecurityUtils.currentUserId(), templateId, req));
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{templateId}/duplicate")
    public ResponseEntity<TemplateResponseDTO> duplicateTemplate(@PathVariable UUID templateId) {
        TemplateResponseDTO copy =
                templateService.duplicateTemplate(SecurityUtils.currentUserId(), templateId);
        return ResponseEntity.status(201).body(copy);
    }

    @PostMapping("/{templateId}/publish")
    public ResponseEntity<TemplateResponseDTO> publishTemplate(@PathVariable UUID templateId) {
        return ResponseEntity.ok(templateService.publishTemplate(templateId));
    }

    @PostMapping("/{templateId}/applications")
    public ResponseEntity<Map<String, String>> applyTemplate(
            @PathVariable UUID templateId, @RequestBody TemplateApplicationRequestDTO req) {
        templateService.applyTemplate(templateId, req);
        return ResponseEntity.ok(
                Map.of("message", "Template applied successfully to selected groups."));
    }

    // --- Questions ---

    @PostMapping("/{templateId}/questions")
    public ResponseEntity<QuestionResponseDTO> addQuestion(
            @PathVariable UUID templateId, @Valid @RequestBody QuestionCreateRequestDTO req) {
        QuestionResponseDTO created =
                templateService.addQuestion(SecurityUtils.currentUserId(), templateId, req);
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping("/{templateId}/questions")
    public ResponseEntity<Map<String, List<QuestionResponseDTO>>> listQuestions(
            @PathVariable UUID templateId) {
        return ResponseEntity.ok(Map.of("data", templateService.listQuestions(templateId)));
    }

    @GetMapping("/{templateId}/questions/{questionId}")
    public ResponseEntity<QuestionResponseDTO> getQuestion(
            @PathVariable UUID templateId, @PathVariable UUID questionId) {
        return ResponseEntity.ok(templateService.getQuestion(templateId, questionId));
    }

    @PatchMapping("/{templateId}/questions/{questionId}")
    public ResponseEntity<QuestionResponseDTO> patchQuestion(
            @PathVariable UUID templateId,
            @PathVariable UUID questionId,
            @RequestBody QuestionPatchRequestDTO req) {
        return ResponseEntity.ok(
                templateService.patchQuestion(
                        SecurityUtils.currentUserId(), templateId, questionId, req));
    }

    @DeleteMapping("/{templateId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable UUID templateId, @PathVariable UUID questionId) {
        templateService.deleteQuestion(templateId, questionId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{templateId}/questions/reorder")
    public ResponseEntity<Map<String, String>> reorderQuestions(
            @PathVariable UUID templateId, @Valid @RequestBody QuestionReorderRequestDTO req) {
        templateService.reorderQuestions(templateId, req);
        return ResponseEntity.ok(Map.of("message", "Questions reordered successfully."));
    }
}

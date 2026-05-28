package com.pms.service.hr;

import com.pms.dto.hr.template.*;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface HrTemplateService {

    TemplateResponseDTO createTemplate(UUID actorId, TemplateCreateRequestDTO request);

    TemplateResponseDTO getTemplate(UUID templateId);

    Page<TemplateListItemDTO> listTemplates(
            String status, String jobCategory, int page, int pageSize);

    TemplateResponseDTO patchTemplate(
            UUID actorId, UUID templateId, TemplatePatchRequestDTO request);

    void deleteTemplate(UUID templateId);

    TemplateResponseDTO duplicateTemplate(UUID actorId, UUID templateId);

    TemplateResponseDTO publishTemplate(UUID templateId);

    void applyTemplate(UUID templateId, TemplateApplicationRequestDTO request);

    QuestionResponseDTO addQuestion(
            UUID actorId, UUID templateId, QuestionCreateRequestDTO request);

    QuestionResponseDTO patchQuestion(
            UUID actorId, UUID templateId, UUID questionId, QuestionPatchRequestDTO request);

    void deleteQuestion(UUID templateId, UUID questionId);

    QuestionResponseDTO getQuestion(UUID templateId, UUID questionId);

    List<QuestionResponseDTO> listQuestions(UUID templateId);

    void reorderQuestions(UUID templateId, QuestionReorderRequestDTO request);
}

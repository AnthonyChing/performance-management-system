package com.pms.service.hr.impl;

import com.pms.audit.Auditable;
import com.pms.dto.hr.template.*;
import com.pms.entity.AssessmentTemplate;
import com.pms.entity.TemplateQuestion;
import com.pms.entity.TemplateVersion;
import com.pms.entity.enums.QuestionType;
import com.pms.entity.enums.TemplateStatus;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.NotFoundException;
import com.pms.repository.AssessmentTemplateRepository;
import com.pms.repository.TemplateQuestionRepository;
import com.pms.repository.TemplateVersionRepository;
import com.pms.service.hr.HrTemplateService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HrTemplateServiceImpl implements HrTemplateService {

    private final AssessmentTemplateRepository templateRepo;
    private final TemplateQuestionRepository questionRepo;
    private final TemplateVersionRepository versionRepo;

    @Override
    @Transactional
    @Auditable(action = "CREATE_TEMPLATE", resource = "assessment_template")
    public TemplateResponseDTO createTemplate(UUID actorId, TemplateCreateRequestDTO req) {
        AssessmentTemplate t =
                AssessmentTemplate.builder()
                        .id(UUID.randomUUID())
                        .name(req.getName())
                        .description(req.getDescription())
                        .jobCategory(req.getJobCategory())
                        .status(TemplateStatus.DRAFT)
                        .isActive(true)
                        .createdBy(actorId)
                        .updatedBy(actorId)
                        .build();
        templateRepo.save(t);
        return TemplateResponseDTO.from(t, 0);
    }

    @Override
    public TemplateResponseDTO getTemplate(UUID templateId) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        long usageCount = templateRepo.countCycleUsages(templateId);
        return TemplateResponseDTO.from(t, usageCount);
    }

    @Override
    public Page<TemplateListItemDTO> listTemplates(
            String status, String jobCategory, int page, int pageSize) {
        return templateRepo
                .findAllFiltered(status, jobCategory, PageRequest.of(page - 1, pageSize))
                .map(TemplateListItemDTO::from);
    }

    @Override
    @Transactional
    @Auditable(
            action = "UPDATE_TEMPLATE",
            resource = "assessment_template",
            resourceIdFrom = "templateId")
    public TemplateResponseDTO patchTemplate(
            UUID actorId, UUID templateId, TemplatePatchRequestDTO req) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        if (t.getStatus() == TemplateStatus.PUBLISHED
                && templateRepo.countCycleUsages(templateId) > 0) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Cannot modify a template that is in use by active cycles");
        }
        if (req.getName() != null) t.setName(req.getName());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getJobCategory() != null) t.setJobCategory(req.getJobCategory());
        t.setUpdatedBy(actorId);
        templateRepo.save(t);
        return TemplateResponseDTO.from(t, templateRepo.countCycleUsages(templateId));
    }

    @Override
    @Transactional
    @Auditable(
            action = "DELETE_TEMPLATE",
            resource = "assessment_template",
            resourceIdFrom = "templateId")
    public void deleteTemplate(UUID templateId) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        if (templateRepo.countCycleUsages(templateId) > 0) {
            throw new ConflictException(
                    "STATE_CONFLICT",
                    "Cannot delete a template that is referenced by performance cycles");
        }
        t.setIsActive(false);
        t.setDeletedAt(OffsetDateTime.now());
        templateRepo.save(t);
    }

    @Override
    @Transactional
    @Auditable(action = "DUPLICATE_TEMPLATE", resource = "assessment_template")
    public TemplateResponseDTO duplicateTemplate(UUID actorId, UUID templateId) {
        AssessmentTemplate source = findActiveTemplate(templateId);
        AssessmentTemplate copy =
                AssessmentTemplate.builder()
                        .id(UUID.randomUUID())
                        .name(source.getName() + " (複製)")
                        .description(source.getDescription())
                        .jobCategory(source.getJobCategory())
                        .status(TemplateStatus.DRAFT)
                        .isActive(true)
                        .createdBy(actorId)
                        .updatedBy(actorId)
                        .build();
        templateRepo.save(copy);

        List<TemplateQuestion> questions =
                questionRepo.findByTemplateIdAndDeletedAtIsNullOrderBySortOrderAsc(templateId);
        for (TemplateQuestion q : questions) {
            questionRepo.save(
                    TemplateQuestion.builder()
                            .id(UUID.randomUUID())
                            .templateId(copy.getId())
                            .questionText(q.getQuestionText())
                            .questionType(q.getQuestionType())
                            .ratingScaleMax(q.getRatingScaleMax())
                            .isRequired(q.getIsRequired())
                            .sortOrder(q.getSortOrder())
                            .createdBy(actorId)
                            .updatedBy(actorId)
                            .build());
        }
        return TemplateResponseDTO.from(copy, 0);
    }

    @Override
    @Transactional
    @Auditable(
            action = "PUBLISH_TEMPLATE",
            resource = "assessment_template",
            resourceIdFrom = "templateId")
    public TemplateResponseDTO publishTemplate(UUID templateId) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        if (t.getStatus() == TemplateStatus.PUBLISHED) {
            throw new ConflictException("STATE_CONFLICT", "Template is already published");
        }
        if (questionRepo.countByTemplateIdAndDeletedAtIsNull(templateId) == 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Cannot publish a template with no questions");
        }
        t.setStatus(TemplateStatus.PUBLISHED);
        templateRepo.save(t);

        TemplateVersion version =
                TemplateVersion.builder()
                        .id(UUID.randomUUID())
                        .templateId(templateId)
                        .version(1)
                        .createdAt(OffsetDateTime.now())
                        .build();
        versionRepo.save(version);

        return TemplateResponseDTO.from(t, templateRepo.countCycleUsages(templateId));
    }

    @Override
    public void applyTemplate(UUID templateId, TemplateApplicationRequestDTO request) {
        findActiveTemplate(templateId);
        // Application to groups is recorded externally; stub returns success
    }

    @Override
    @Transactional
    public QuestionResponseDTO addQuestion(
            UUID actorId, UUID templateId, QuestionCreateRequestDTO req) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        if (t.getStatus() == TemplateStatus.PUBLISHED) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Cannot add questions to a published template");
        }
        QuestionType type = QuestionType.fromDbValue(req.getQuestionType());
        if (type == QuestionType.RATING && req.getRatingScaleMax() == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "rating_scale_max is required when question_type is 'rating'");
        }
        long nextOrder = questionRepo.countByTemplateIdAndDeletedAtIsNull(templateId);
        TemplateQuestion q =
                TemplateQuestion.builder()
                        .id(UUID.randomUUID())
                        .templateId(templateId)
                        .questionText(req.getQuestionText())
                        .questionType(type)
                        .ratingScaleMax(req.getRatingScaleMax())
                        .isRequired(req.getIsRequired() != null ? req.getIsRequired() : true)
                        .sortOrder((int) nextOrder)
                        .createdBy(actorId)
                        .updatedBy(actorId)
                        .build();
        questionRepo.save(q);
        return QuestionResponseDTO.from(q);
    }

    @Override
    @Transactional
    public QuestionResponseDTO patchQuestion(
            UUID actorId, UUID templateId, UUID questionId, QuestionPatchRequestDTO req) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        if (t.getStatus() == TemplateStatus.PUBLISHED
                && templateRepo.countCycleUsages(templateId) > 0) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Cannot modify questions of a template in use");
        }
        TemplateQuestion q =
                questionRepo
                        .findByIdAndTemplateIdAndDeletedAtIsNull(questionId, templateId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Question not found"));
        if (req.getQuestionText() != null) q.setQuestionText(req.getQuestionText());
        if (req.getQuestionType() != null)
            q.setQuestionType(QuestionType.fromDbValue(req.getQuestionType()));
        if (req.getRatingScaleMax() != null) q.setRatingScaleMax(req.getRatingScaleMax());
        if (req.getIsRequired() != null) q.setIsRequired(req.getIsRequired());
        q.setUpdatedBy(actorId);
        questionRepo.save(q);
        return QuestionResponseDTO.from(q);
    }

    @Override
    @Transactional
    public void deleteQuestion(UUID templateId, UUID questionId) {
        findActiveTemplate(templateId);
        TemplateQuestion q =
                questionRepo
                        .findByIdAndTemplateIdAndDeletedAtIsNull(questionId, templateId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Question not found"));
        q.setDeletedAt(OffsetDateTime.now());
        questionRepo.save(q);
        rebalanceSortOrder(templateId);
    }

    @Override
    public QuestionResponseDTO getQuestion(UUID templateId, UUID questionId) {
        findActiveTemplate(templateId);
        TemplateQuestion q =
                questionRepo
                        .findByIdAndTemplateIdAndDeletedAtIsNull(questionId, templateId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "RESOURCE_NOT_FOUND", "Question not found"));
        return QuestionResponseDTO.from(q);
    }

    @Override
    public List<QuestionResponseDTO> listQuestions(UUID templateId) {
        findActiveTemplate(templateId);
        return questionRepo
                .findByTemplateIdAndDeletedAtIsNullOrderBySortOrderAsc(templateId)
                .stream()
                .map(QuestionResponseDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public void reorderQuestions(UUID templateId, QuestionReorderRequestDTO req) {
        AssessmentTemplate t = findActiveTemplate(templateId);
        if (t.getStatus() == TemplateStatus.PUBLISHED) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Cannot reorder questions of a published template");
        }
        List<TemplateQuestion> existing =
                questionRepo.findByTemplateIdAndDeletedAtIsNullOrderBySortOrderAsc(templateId);
        if (req.getOrderedQuestionIds().size() != existing.size()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "ordered_question_ids count does not match current question count");
        }
        for (int i = 0; i < req.getOrderedQuestionIds().size(); i++) {
            UUID qId = req.getOrderedQuestionIds().get(i);
            TemplateQuestion q =
                    existing.stream()
                            .filter(x -> x.getId().equals(qId))
                            .findFirst()
                            .orElseThrow(
                                    () ->
                                            new ApiException(
                                                    HttpStatus.BAD_REQUEST,
                                                    "VALIDATION_ERROR",
                                                    "Invalid question ID in ordered list"));
            q.setSortOrder(i);
            questionRepo.save(q);
        }
    }

    private AssessmentTemplate findActiveTemplate(UUID templateId) {
        return templateRepo
                .findByIdAndDeletedAtIsNull(templateId)
                .orElseThrow(
                        () -> new NotFoundException("RESOURCE_NOT_FOUND", "Template not found"));
    }

    private void rebalanceSortOrder(UUID templateId) {
        List<TemplateQuestion> remaining =
                questionRepo.findByTemplateIdAndDeletedAtIsNullOrderBySortOrderAsc(templateId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setSortOrder(i);
            questionRepo.save(remaining.get(i));
        }
    }
}

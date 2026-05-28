package com.pms.service.hr.impl;

import com.pms.dto.hr.evaluation.*;
import com.pms.entity.*;
import com.pms.entity.enums.CycleStatus;
import com.pms.entity.enums.EvaluationTemplateStatus;
import com.pms.entity.enums.TemplateStatus;
import com.pms.exception.ApiException;
import com.pms.exception.ConflictException;
import com.pms.exception.NotFoundException;
import org.springframework.http.HttpStatus;
import com.pms.repository.*;
import com.pms.service.hr.HrEvaluationTemplateService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HrEvaluationTemplateServiceImpl implements HrEvaluationTemplateService {

    private final EvaluationTemplateRepository evalTemplateRepo;
    private final EvaluationTemplateComponentRepository componentRepo;
    private final AssessmentTemplateRepository assessmentTemplateRepo;
    private final TemplateVersionRepository templateVersionRepo;
    private final TemplateQuestionRepository questionRepo;
    private final PerformanceCycleRepository cycleRepo;
    private final DepartmentRepository departmentRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional
    public EvaluationTemplateResponse createEvaluationTemplate(
            UUID actorId, CreateEvaluationTemplateRequest req) {

        PerformanceCycle cycle = findCycleOrThrow(req.getCycleId());
        assertCycleEditable(cycle);

        String[] groupParts = parseEmployeeGroupId(req.getEmployeeGroupId());
        String groupType = groupParts[0];
        String groupRef = groupParts[1];
        validateEmployeeGroup(groupType, groupRef);

        String normalizedRef = "all".equals(groupType) ? null : groupRef;
        if (evalTemplateRepo
                .existsByCycleIdAndEmployeeGroupTypeAndEmployeeGroupRefAndDeletedAtIsNullAndArchivedAtIsNull(
                        req.getCycleId(), groupType, normalizedRef)) {
            throw new ConflictException(
                    "CYCLE_TEMPLATE_CONFLICT",
                    "An active evaluation template already exists for this cycle and employee group.");
        }

        List<ComponentBuildInfo> componentInfos = buildAndValidateComponents(req.getAssessmentTemplates());
        validateWeightSum(componentInfos);

        EvaluationTemplate saved =
                evalTemplateRepo.save(
                        EvaluationTemplate.builder()
                                .id(UUID.randomUUID())
                                .cycleId(req.getCycleId())
                                .name(req.getName())
                                .description(req.getDescription())
                                .status(EvaluationTemplateStatus.PUBLISHED)
                                .employeeGroupType(groupType)
                                .employeeGroupRef(normalizedRef)
                                .isActive(true)
                                .createdBy(actorId)
                                .updatedBy(actorId)
                                .build());

        List<EvaluationTemplateComponent> components = saveComponents(saved.getId(), componentInfos);
        return buildResponse(saved, cycle, components);
    }

    @Override
    public EvaluationTemplateResponse getEvaluationTemplate(UUID templateId) {
        EvaluationTemplate et = findActiveOrThrow(templateId);
        PerformanceCycle cycle = findCycleOrThrow(et.getCycleId());
        List<EvaluationTemplateComponent> components =
                componentRepo.findByEvaluationTemplateIdOrderBySortOrder(templateId);
        return buildResponse(et, cycle, components);
    }

    @Override
    @Transactional
    public EvaluationTemplateResponse patchEvaluationTemplate(
            UUID actorId, UUID templateId, PatchEvaluationTemplateRequest req) {

        EvaluationTemplate et = findActiveOrThrow(templateId);
        PerformanceCycle cycle = findCycleOrThrow(et.getCycleId());

        if (et.getStatus() == EvaluationTemplateStatus.ARCHIVED) {
            throw new ConflictException(
                    "STATE_CONFLICT", "Archived evaluation templates cannot be modified.");
        }

        if (!isCycleEditable(cycle)) {
            throw new ConflictException(
                    "STATE_CONFLICT",
                    "The associated performance cycle has already started; the evaluation template cannot be modified.");
        }

        if ("archived".equals(req.getStatus())) {
            et.setStatus(EvaluationTemplateStatus.ARCHIVED);
            et.setArchivedAt(OffsetDateTime.now());
            et.setUpdatedBy(actorId);
            EvaluationTemplate saved = evalTemplateRepo.save(et);
            List<EvaluationTemplateComponent> components =
                    componentRepo.findByEvaluationTemplateIdOrderBySortOrder(templateId);
            return buildResponse(saved, cycle, components);
        }

        if (req.getName() != null) et.setName(req.getName());
        if (req.getDescription() != null) et.setDescription(req.getDescription());

        if (req.getCycleId() != null) {
            PerformanceCycle newCycle = findCycleOrThrow(req.getCycleId());
            assertCycleEditable(newCycle);
            et.setCycleId(req.getCycleId());
            cycle = newCycle;
        }

        if (req.getEmployeeGroupId() != null) {
            String[] parts = parseEmployeeGroupId(req.getEmployeeGroupId());
            validateEmployeeGroup(parts[0], parts[1]);
            String normalizedRef = "all".equals(parts[0]) ? null : parts[1];
            UUID checkCycleId = req.getCycleId() != null ? req.getCycleId() : et.getCycleId();
            if (!parts[0].equals(et.getEmployeeGroupType())
                    || !Objects.equals(normalizedRef, et.getEmployeeGroupRef())) {
                if (evalTemplateRepo
                        .existsByCycleIdAndEmployeeGroupTypeAndEmployeeGroupRefAndDeletedAtIsNullAndArchivedAtIsNull(
                                checkCycleId, parts[0], normalizedRef)) {
                    throw new ConflictException(
                            "CYCLE_TEMPLATE_CONFLICT",
                            "An active evaluation template already exists for this cycle and employee group.");
                }
            }
            et.setEmployeeGroupType(parts[0]);
            et.setEmployeeGroupRef(normalizedRef);
        }

        if (req.getAssessmentTemplates() != null) {
            List<ComponentBuildInfo> componentInfos =
                    buildAndValidateComponents(req.getAssessmentTemplates());
            validateWeightSum(componentInfos);
            componentRepo.deleteAllByEvaluationTemplateId(templateId);
            componentRepo.flush();
            saveComponents(templateId, componentInfos);
        }

        et.setUpdatedBy(actorId);
        EvaluationTemplate saved = evalTemplateRepo.save(et);
        List<EvaluationTemplateComponent> components =
                componentRepo.findByEvaluationTemplateIdOrderBySortOrder(saved.getId());
        return buildResponse(saved, cycle, components);
    }

    @Override
    public Page<EvaluationTemplateListItemResponse> listEvaluationTemplates(
            int page, int pageSize, String status, UUID cycleId, String q) {
        String cycleIdStr = cycleId != null ? cycleId.toString() : null;
        return evalTemplateRepo
                .findAllFiltered(status, cycleIdStr, q, PageRequest.of(page - 1, pageSize))
                .map(et -> {
                    PerformanceCycle cycle = cycleRepo.findById(et.getCycleId()).orElse(null);
                    List<EvaluationTemplateComponent> components =
                            componentRepo.findByEvaluationTemplateIdOrderBySortOrder(et.getId());
                    BigDecimal totalWeight =
                            components.stream()
                                    .map(EvaluationTemplateComponent::getWeightPercent)
                                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                    AvailableActionsDto actions = computeActions(et, cycle);
                    return EvaluationTemplateListItemResponse.builder()
                            .templateId(et.getId())
                            .cycle(toCycleDto(cycle))
                            .name(et.getName())
                            .description(et.getDescription())
                            .status(et.getStatus().getDbValue())
                            .employeeGroup(toGroupDto(et))
                            .assessmentTemplateCount(components.size())
                            .totalWeightPercent(totalWeight)
                            .availableActions(actions)
                            .updatedAt(et.getUpdatedAt())
                            .build();
                });
    }

    @Override
    public List<EmployeeGroupDto> getEmployeeGroups() {
        List<EmployeeGroupDto> groups = new ArrayList<>();

        groups.add(
                EmployeeGroupDto.builder()
                        .groupId("all")
                        .groupType("all")
                        .name("全體員工")
                        .description("所有 active 員工")
                        .build());

        departmentRepo.findAllByClosedAtIsNull().stream()
                .sorted(Comparator.comparing(Department::getName))
                .forEach(
                        d ->
                                groups.add(
                                        EmployeeGroupDto.builder()
                                                .groupId("department:" + d.getId())
                                                .groupType("department")
                                                .name(d.getName())
                                                .description("目前隸屬 " + d.getName() + " 的員工")
                                                .build()));

        List<String> jobCategories =
                userRepo
                        .findDistinctJobCategories()
                        .stream()
                        .filter(Objects::nonNull)
                        .sorted()
                        .toList();
        jobCategories.forEach(
                jc ->
                        groups.add(
                                EmployeeGroupDto.builder()
                                        .groupId("job_category:" + jc)
                                        .groupType("job_category")
                                        .name(jc)
                                        .description("job_category = " + jc + " 的員工")
                                        .build()));

        return groups;
    }

    // ---- private helpers ----

    private PerformanceCycle findCycleOrThrow(UUID cycleId) {
        return cycleRepo
                .findById(cycleId)
                .orElseThrow(
                        () -> new NotFoundException("CYCLE_NOT_FOUND", "Performance cycle not found."));
    }

    private EvaluationTemplate findActiveOrThrow(UUID templateId) {
        return evalTemplateRepo
                .findByIdAndDeletedAtIsNull(templateId)
                .orElseThrow(
                        () ->
                                new NotFoundException(
                                        "RESOURCE_NOT_FOUND", "Evaluation template not found."));
    }

    private boolean isCycleEditable(PerformanceCycle cycle) {
        return cycle.getStatus() == CycleStatus.NOT_STARTED;
    }

    private void assertCycleEditable(PerformanceCycle cycle) {
        if (!isCycleEditable(cycle)) {
            throw new ConflictException(
                    "STATE_CONFLICT",
                    "Evaluation templates can only be created or modified when the cycle is not_started.");
        }
    }

    private String[] parseEmployeeGroupId(String groupId) {
        if ("all".equals(groupId)) {
            return new String[]{"all", null};
        }
        if (groupId.startsWith("department:")) {
            String ref = groupId.substring("department:".length());
            return new String[]{"department", ref};
        }
        if (groupId.startsWith("job_category:")) {
            String ref = groupId.substring("job_category:".length());
            return new String[]{"job_category", ref};
        }
        throw new NotFoundException(
                "EMPLOYEE_GROUP_NOT_FOUND",
                "Invalid employee_group_id format: " + groupId);
    }

    private void validateEmployeeGroup(String groupType, String groupRef) {
        if ("department".equals(groupType)) {
            try {
                UUID deptId = UUID.fromString(groupRef);
                departmentRepo
                        .findById(deptId)
                        .filter(d -> d.getClosedAt() == null)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "EMPLOYEE_GROUP_NOT_FOUND",
                                                "Department not found: " + groupRef));
            } catch (IllegalArgumentException e) {
                throw new NotFoundException(
                        "EMPLOYEE_GROUP_NOT_FOUND", "Invalid department UUID: " + groupRef);
            }
        }
    }

    private record ComponentBuildInfo(
            AssessmentTemplate assessmentTemplate,
            TemplateVersion version,
            BigDecimal weightPercent,
            int sortOrder) {}

    private List<ComponentBuildInfo> buildAndValidateComponents(
            List<AssessmentTemplateComponentRequest> requests) {
        List<ComponentBuildInfo> infos = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            AssessmentTemplateComponentRequest r = requests.get(i);
            AssessmentTemplate at =
                    assessmentTemplateRepo
                            .findByIdAndDeletedAtIsNull(r.getAssessmentTemplateId())
                            .orElseThrow(
                                    () ->
                                            new NotFoundException(
                                                    "ASSESSMENT_TEMPLATE_NOT_FOUND",
                                                    "Assessment template not found: "
                                                            + r.getAssessmentTemplateId()));
            if (at.getStatus() != TemplateStatus.PUBLISHED) {
                throw new ConflictException(
                        "ASSESSMENT_TEMPLATE_NOT_PUBLISHED",
                        "Assessment template is not published: " + r.getAssessmentTemplateId());
            }
            TemplateVersion version =
                    templateVersionRepo
                            .findTopByTemplateIdOrderByVersionDesc(r.getAssessmentTemplateId())
                            .orElseThrow(
                                    () ->
                                            new NotFoundException(
                                                    "ASSESSMENT_TEMPLATE_NOT_FOUND",
                                                    "No version found for assessment template: "
                                                            + r.getAssessmentTemplateId()));
            infos.add(new ComponentBuildInfo(at, version, r.getWeightPercent(), i));
        }
        return infos;
    }

    private void validateWeightSum(List<ComponentBuildInfo> infos) {
        BigDecimal sum =
                infos.stream()
                        .map(ComponentBuildInfo::weightPercent)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(new BigDecimal("100.00")) != 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "WEIGHT_SUM_INVALID",
                    "The sum of weight_percent must equal 100, got: " + sum.toPlainString());
        }
    }

    private List<EvaluationTemplateComponent> saveComponents(
            UUID evalTemplateId, List<ComponentBuildInfo> infos) {
        return infos.stream()
                .map(
                        info ->
                                componentRepo.save(
                                        EvaluationTemplateComponent.builder()
                                                .id(UUID.randomUUID())
                                                .evaluationTemplateId(evalTemplateId)
                                                .assessmentTemplateId(info.assessmentTemplate().getId())
                                                .assessmentTemplateVersionId(info.version().getId())
                                                .weightPercent(info.weightPercent())
                                                .sortOrder(info.sortOrder())
                                                .build()))
                .collect(Collectors.toList());
    }

    private EvaluationTemplateResponse buildResponse(
            EvaluationTemplate et,
            PerformanceCycle cycle,
            List<EvaluationTemplateComponent> components) {

        Map<UUID, AssessmentTemplate> templateMap = new LinkedHashMap<>();
        for (EvaluationTemplateComponent c : components) {
            assessmentTemplateRepo
                    .findById(c.getAssessmentTemplateId())
                    .ifPresent(at -> templateMap.put(c.getAssessmentTemplateId(), at));
        }

        List<AssessmentTemplateComponentDto> componentDtos =
                components.stream()
                        .map(
                                c -> {
                                    AssessmentTemplate at = templateMap.get(c.getAssessmentTemplateId());
                                    long qCount =
                                            at != null
                                                    ? questionRepo.countByTemplateIdAndDeletedAtIsNull(
                                                            c.getAssessmentTemplateId())
                                                    : 0;
                                    return AssessmentTemplateComponentDto.builder()
                                            .assessmentTemplateId(c.getAssessmentTemplateId())
                                            .assessmentTemplateVersionId(c.getAssessmentTemplateVersionId())
                                            .name(at != null ? at.getName() : null)
                                            .questionCount((int) qCount)
                                            .weightPercent(c.getWeightPercent())
                                            .build();
                                })
                        .toList();

        BigDecimal totalWeight =
                components.stream()
                        .map(EvaluationTemplateComponent::getWeightPercent)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);

        AvailableActionsDto actions = computeActions(et, cycle);

        return EvaluationTemplateResponse.builder()
                .templateId(et.getId())
                .cycle(toCycleDto(cycle))
                .name(et.getName())
                .description(et.getDescription())
                .status(et.getStatus().getDbValue())
                .employeeGroup(toGroupDto(et))
                .assessmentTemplates(componentDtos)
                .totalWeightPercent(totalWeight)
                .availableActions(actions)
                .createdBy(et.getCreatedBy())
                .updatedBy(et.getUpdatedBy())
                .createdAt(et.getCreatedAt())
                .updatedAt(et.getUpdatedAt())
                .build();
    }

    private AvailableActionsDto computeActions(EvaluationTemplate et, PerformanceCycle cycle) {
        if (et.getStatus() == EvaluationTemplateStatus.ARCHIVED) {
            return AvailableActionsDto.builder()
                    .canEdit(false)
                    .canArchive(false)
                    .editBlockedReason("TEMPLATE_ARCHIVED")
                    .build();
        }
        boolean cycleEditable = cycle != null && isCycleEditable(cycle);
        if (!cycleEditable) {
            return AvailableActionsDto.builder()
                    .canEdit(false)
                    .canArchive(false)
                    .editBlockedReason("FORMAL_REVIEW_STARTED")
                    .build();
        }
        return AvailableActionsDto.builder()
                .canEdit(true)
                .canArchive(true)
                .editBlockedReason(null)
                .build();
    }

    private EvalCycleInfoDto toCycleDto(PerformanceCycle cycle) {
        if (cycle == null) return null;
        return EvalCycleInfoDto.builder()
                .cycleId(cycle.getId())
                .name(cycle.getName())
                .cycleType(cycle.getCycleType().getDbValue())
                .status(cycle.getStatus().getDbValue())
                .build();
    }

    private EmployeeGroupDto toGroupDto(EvaluationTemplate et) {
        String groupType = et.getEmployeeGroupType();
        String groupRef = et.getEmployeeGroupRef();
        String groupId =
                "all".equals(groupType) ? "all" : groupType + ":" + groupRef;
        String name =
                switch (groupType) {
                    case "all" -> "全體員工";
                    case "department" -> {
                        Department d = departmentRepo.findById(UUID.fromString(groupRef)).orElse(null);
                        yield d != null ? d.getName() : groupRef;
                    }
                    default -> groupRef;
                };
        return EmployeeGroupDto.builder()
                .groupId(groupId)
                .groupType(groupType)
                .name(name)
                .description(null)
                .build();
    }
}

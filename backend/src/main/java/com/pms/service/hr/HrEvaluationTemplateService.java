package com.pms.service.hr;

import com.pms.dto.hr.evaluation.CreateEvaluationTemplateRequest;
import com.pms.dto.hr.evaluation.EmployeeGroupDto;
import com.pms.dto.hr.evaluation.EvaluationTemplateListItemResponse;
import com.pms.dto.hr.evaluation.EvaluationTemplateResponse;
import com.pms.dto.hr.evaluation.PatchEvaluationTemplateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface HrEvaluationTemplateService {

    EvaluationTemplateResponse createEvaluationTemplate(
            UUID actorId, CreateEvaluationTemplateRequest req);

    EvaluationTemplateResponse getEvaluationTemplate(UUID templateId);

    EvaluationTemplateResponse patchEvaluationTemplate(
            UUID actorId, UUID templateId, PatchEvaluationTemplateRequest req);

    Page<EvaluationTemplateListItemResponse> listEvaluationTemplates(
            int page, int pageSize, String status, UUID cycleId, String q);

    List<EmployeeGroupDto> getEmployeeGroups();
}

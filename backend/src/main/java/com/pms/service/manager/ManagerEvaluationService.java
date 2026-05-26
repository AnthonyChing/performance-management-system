package com.pms.service.manager;

import com.pms.dto.manager.evaluation.ManagerEvaluationResponseDTO;
import com.pms.dto.manager.evaluation.ManagerEvaluationUpdateRequestDTO;
import com.pms.dto.manager.evaluation.ManagerKpiEvaluationUpdateRequestDTO;
import com.pms.dto.manager.evaluation.ManagerQuestionnaireResponseDTO;
import com.pms.dto.manager.evaluation.ManagerQuestionnaireUpdateRequestDTO;
import java.util.List;
import java.util.UUID;

public interface ManagerEvaluationService {

    ManagerEvaluationResponseDTO updateEvaluation(
            UUID managerId,
            UUID subordinateId,
            UUID evaluationId,
            ManagerEvaluationUpdateRequestDTO request);

    ManagerQuestionnaireResponseDTO updateQuestionnaire(
            UUID managerId,
            UUID subordinateId,
            UUID evaluationId,
            ManagerQuestionnaireUpdateRequestDTO request);

    ManagerEvaluationResponseDTO updateKpiEvaluation(
            UUID managerId,
            UUID subordinateId,
            UUID evaluationId,
            ManagerKpiEvaluationUpdateRequestDTO request);

    List<ManagerEvaluationResponseDTO> listEvaluations(
            UUID managerId, UUID subordinateId, String cycleId);
}

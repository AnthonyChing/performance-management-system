package com.pms.service.manager;

import com.pms.dto.manager.goal.ManagerGoalCreateRequestDTO;
import com.pms.dto.manager.goal.ManagerGoalPatchRequestDTO;
import com.pms.dto.manager.goal.ManagerGoalResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ManagerGoalService {

    ManagerGoalResponseDTO createGoal(UUID managerId, UUID subordinateId, ManagerGoalCreateRequestDTO request);

    ManagerGoalResponseDTO patchGoal(UUID managerId, UUID subordinateId, UUID goalId, ManagerGoalPatchRequestDTO request);

    List<ManagerGoalResponseDTO> listGoals(UUID managerId, UUID subordinateId, String cycleId, String status);
}

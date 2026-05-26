package com.pms.service.manager;

import com.pms.dto.manager.appeal.ManagerAppealDetailDTO;
import com.pms.dto.manager.appeal.ManagerAppealListItemDTO;
import com.pms.dto.manager.appeal.ManagerAppealPatchRequestDTO;

import java.util.List;
import java.util.UUID;

public interface ManagerAppealService {

    List<ManagerAppealListItemDTO> listAppeals(UUID teamId, String status);

    ManagerAppealDetailDTO getAppeal(UUID teamId, UUID appealId);

    ManagerAppealDetailDTO handleAppeal(UUID managerId, UUID teamId, UUID appealId, ManagerAppealPatchRequestDTO request);
}

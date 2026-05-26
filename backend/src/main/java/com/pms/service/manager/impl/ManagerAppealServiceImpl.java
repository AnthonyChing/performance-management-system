package com.pms.service.manager.impl;

import com.pms.dto.manager.appeal.ManagerAppealDetailDTO;
import com.pms.dto.manager.appeal.ManagerAppealListItemDTO;
import com.pms.dto.manager.appeal.ManagerAppealPatchRequestDTO;
import com.pms.entity.Appeal;
import com.pms.entity.AppealResponse;
import com.pms.entity.enums.AppealStatus;
import com.pms.exception.ConflictException;
import com.pms.exception.ForbiddenException;
import com.pms.exception.NotFoundException;
import com.pms.repository.AppealRepository;
import com.pms.repository.AppealResponseRepository;
import com.pms.service.manager.ManagerAppealService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ManagerAppealServiceImpl implements ManagerAppealService {

    private final AppealRepository appealRepo;
    private final AppealResponseRepository appealResponseRepo;

    @Override
    public List<ManagerAppealListItemDTO> listAppeals(UUID teamId, String status) {
        return appealRepo.findByAssignedToFiltered(teamId, status)
                .stream().map(ManagerAppealListItemDTO::from).toList();
    }

    @Override
    public ManagerAppealDetailDTO getAppeal(UUID teamId, UUID appealId) {
        Appeal appeal = findAppealForTeam(teamId, appealId);
        List<AppealResponse> responses = appealResponseRepo.findByAppealIdOrderByRespondedAtAsc(appealId);
        return ManagerAppealDetailDTO.from(appeal, responses);
    }

    @Override
    @Transactional
    public ManagerAppealDetailDTO handleAppeal(UUID managerId, UUID teamId, UUID appealId,
                                                ManagerAppealPatchRequestDTO req) {
        Appeal appeal = findAppealForTeam(teamId, appealId);
        if (appeal.getResolvedAt() != null) {
            throw new ConflictException("STATE_CONFLICT", "This appeal has already been resolved");
        }

        boolean isFinal = Boolean.TRUE.equals(req.getIsFinal());
        AppealResponse response = AppealResponse.builder()
                .id(UUID.randomUUID())
                .appealId(appealId)
                .respondedBy(managerId)
                .responseText(req.getResponseText())
                .isFinal(isFinal)
                .respondedAt(OffsetDateTime.now())
                .build();
        appealResponseRepo.save(response);

        if (isFinal) {
            appeal.setStatus(AppealStatus.APPROVED);
            appeal.setResolvedAt(OffsetDateTime.now());
            appealRepo.save(appeal);
        } else if (appeal.getStatus() == AppealStatus.SUBMITTED) {
            appeal.setStatus(AppealStatus.UNDER_REVIEW);
            appealRepo.save(appeal);
        }

        List<AppealResponse> responses = appealResponseRepo.findByAppealIdOrderByRespondedAtAsc(appealId);
        return ManagerAppealDetailDTO.from(appeal, responses);
    }

    private Appeal findAppealForTeam(UUID teamId, UUID appealId) {
        return appealRepo.findByIdAndAssignedTo(appealId, teamId)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Appeal not found"));
    }
}

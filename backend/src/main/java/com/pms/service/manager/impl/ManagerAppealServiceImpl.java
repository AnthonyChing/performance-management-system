package com.pms.service.manager.impl;

import com.pms.audit.Auditable;
import com.pms.dto.manager.appeal.ManagerAppealDetailDTO;
import com.pms.dto.manager.appeal.ManagerAppealListItemDTO;
import com.pms.dto.manager.appeal.ManagerAppealPatchRequestDTO;
import com.pms.entity.Appeal;
import com.pms.entity.AppealResponse;
import com.pms.entity.User;
import com.pms.entity.enums.AppealStatus;
import com.pms.exception.ConflictException;
import com.pms.exception.NotFoundException;
import com.pms.repository.AppealRepository;
import com.pms.repository.AppealResponseRepository;
import com.pms.repository.UserRepository;
import com.pms.service.manager.ManagerAppealService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerAppealServiceImpl implements ManagerAppealService {

    private final AppealRepository appealRepo;
    private final AppealResponseRepository appealResponseRepo;
    private final UserRepository userRepo;

    @Override
    public List<ManagerAppealListItemDTO> listAppeals(UUID teamId, String status) {
        List<Appeal> appeals = appealRepo.findByAssignedToFiltered(teamId, status);
        List<UUID> userIds =
                appeals.stream()
                        .flatMap(a -> Stream.of(a.getFiledBy(), a.getAssignedTo()))
                        .distinct()
                        .toList();
        Map<UUID, String> nameById =
                userRepo.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getFullName));
        return appeals.stream()
                .map(
                        a ->
                                ManagerAppealListItemDTO.from(
                                        a,
                                        nameById.getOrDefault(a.getFiledBy(), ""),
                                        nameById.getOrDefault(a.getAssignedTo(), "")))
                .toList();
    }

    @Override
    public ManagerAppealDetailDTO getAppeal(UUID teamId, UUID appealId) {
        Appeal appeal = findAppealForTeam(teamId, appealId);
        List<AppealResponse> responses =
                appealResponseRepo.findByAppealIdOrderByRespondedAtAsc(appealId);
        Map<UUID, String> nameById =
                userRepo
                        .findAllById(List.of(appeal.getFiledBy(), appeal.getAssignedTo()))
                        .stream()
                        .collect(Collectors.toMap(User::getId, User::getFullName));
        return ManagerAppealDetailDTO.from(
                appeal,
                responses,
                nameById.getOrDefault(appeal.getFiledBy(), ""),
                nameById.getOrDefault(appeal.getAssignedTo(), ""));
    }

    @Override
    @Transactional
    @Auditable(action = "RESPOND_TO_APPEAL", resource = "appeal", resourceIdFrom = "appealId")
    public ManagerAppealDetailDTO handleAppeal(
            UUID managerId, UUID teamId, UUID appealId, ManagerAppealPatchRequestDTO req) {
        Appeal appeal = findAppealForTeam(teamId, appealId);
        if (appeal.getResolvedAt() != null) {
            throw new ConflictException("STATE_CONFLICT", "This appeal has already been resolved");
        }

        boolean isFinal = Boolean.TRUE.equals(req.getIsFinal());
        AppealResponse response =
                AppealResponse.builder()
                        .id(UUID.randomUUID())
                        .appealId(appealId)
                        .respondedBy(managerId)
                        .responseText(req.getResponseText())
                        .isFinal(isFinal)
                        .respondedAt(OffsetDateTime.now())
                        .build();
        appealResponseRepo.save(response);

        if (isFinal) {
            AppealStatus resolved;
            if ("rejected".equalsIgnoreCase(req.getOutcome())) {
                resolved = AppealStatus.REJECTED;
            } else {
                resolved = AppealStatus.APPROVED;
            }
            appeal.setStatus(resolved);
            appeal.setResolvedAt(OffsetDateTime.now());
            appealRepo.save(appeal);
        } else if (appeal.getStatus() == AppealStatus.SUBMITTED) {
            appeal.setStatus(AppealStatus.UNDER_REVIEW);
            appealRepo.save(appeal);
        }

        List<AppealResponse> responses =
                appealResponseRepo.findByAppealIdOrderByRespondedAtAsc(appealId);
        Map<UUID, String> nameById =
                userRepo
                        .findAllById(List.of(appeal.getFiledBy(), appeal.getAssignedTo()))
                        .stream()
                        .collect(Collectors.toMap(User::getId, User::getFullName));
        return ManagerAppealDetailDTO.from(
                appeal,
                responses,
                nameById.getOrDefault(appeal.getFiledBy(), ""),
                nameById.getOrDefault(appeal.getAssignedTo(), ""));
    }

    private Appeal findAppealForTeam(UUID teamId, UUID appealId) {
        return appealRepo
                .findByIdAndAssignedTo(appealId, teamId)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Appeal not found"));
    }
}

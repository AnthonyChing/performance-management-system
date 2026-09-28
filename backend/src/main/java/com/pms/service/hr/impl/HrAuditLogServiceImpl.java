package com.pms.service.hr.impl;

import com.pms.dto.hr.audit.AuditLogDTO;
import com.pms.entity.AuditLog;
import com.pms.entity.User;
import com.pms.repository.AuditLogRepository;
import com.pms.repository.UserRepository;
import com.pms.service.hr.HrAuditLogService;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HrAuditLogServiceImpl implements HrAuditLogService {

    private final AuditLogRepository auditLogRepo;
    private final UserRepository userRepo;

    @Override
    public Page<AuditLogDTO> listAuditLogs(
            String action,
            String resource,
            UUID actorId,
            OffsetDateTime from,
            OffsetDateTime to,
            int page,
            int pageSize) {

        String actorIdStr = actorId != null ? actorId.toString() : null;
        Page<AuditLog> logs =
                auditLogRepo.findFiltered(
                        action, resource, actorIdStr, from, to, PageRequest.of(page - 1, pageSize));

        java.util.List<UUID> actorIds =
                logs.stream()
                        .map(
                                log -> {
                                    UUID fallback =
                                            "LOGIN_GOOGLE".equals(log.getAction())
                                                    ? log.getResourceId()
                                                    : null;
                                    return log.getActorId() != null ? log.getActorId() : fallback;
                                })
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .toList();

        java.util.Map<UUID, User> userMap = new java.util.HashMap<>();
        userRepo.findAllById(actorIds).forEach(u -> userMap.put(u.getId(), u));

        return logs.map(
                log -> {
                    UUID fallback =
                            "LOGIN_GOOGLE".equals(log.getAction()) ? log.getResourceId() : null;
                    UUID actualActorId = log.getActorId() != null ? log.getActorId() : fallback;
                    User actor = actualActorId != null ? userMap.get(actualActorId) : null;
                    String name = actor != null ? actor.getFullName() : "系統/未知操作者";
                    return AuditLogDTO.builder()
                            .id(log.getId())
                            .actorId(actualActorId)
                            .actorName(name)
                            .action(log.getAction())
                            .resource(log.getResource())
                            .resourceId(log.getResourceId())
                            .oldValue(log.getOldValue())
                            .newValue(log.getNewValue())
                            .ipAddress(log.getIpAddress())
                            .createdAt(log.getCreatedAt())
                            .build();
                });
    }

    @Override
    public void exportAuditLogs(
            String action, String resource, OffsetDateTime from, OffsetDateTime to) {
        // Export is async / external; stub returns success
    }
}

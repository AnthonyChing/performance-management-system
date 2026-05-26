package com.pms.service.hr.impl;

import com.pms.dto.hr.audit.AuditLogDTO;
import com.pms.entity.AuditLog;
import com.pms.repository.AuditLogRepository;
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
        return auditLogRepo
                .findFiltered(
                        action, resource, actorIdStr, from, to, PageRequest.of(page - 1, pageSize))
                .map(this::toDTO);
    }

    @Override
    public void exportAuditLogs(
            String action, String resource, OffsetDateTime from, OffsetDateTime to) {
        // Export is async / external; stub returns success
    }

    private AuditLogDTO toDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .action(log.getAction())
                .resource(log.getResource())
                .resourceId(log.getResourceId())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}

package com.pms.service.hr;

import com.pms.dto.hr.audit.AuditLogDTO;
import org.springframework.data.domain.Page;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface HrAuditLogService {

    Page<AuditLogDTO> listAuditLogs(
            String action, String resource, UUID actorId,
            OffsetDateTime from, OffsetDateTime to,
            int page, int pageSize);

    void exportAuditLogs(String action, String resource, OffsetDateTime from, OffsetDateTime to);
}

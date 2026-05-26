package com.pms.service.hr;

import com.pms.dto.hr.audit.AuditLogDTO;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface HrAuditLogService {

    Page<AuditLogDTO> listAuditLogs(
            String action,
            String resource,
            UUID actorId,
            OffsetDateTime from,
            OffsetDateTime to,
            int page,
            int pageSize);

    void exportAuditLogs(String action, String resource, OffsetDateTime from, OffsetDateTime to);
}

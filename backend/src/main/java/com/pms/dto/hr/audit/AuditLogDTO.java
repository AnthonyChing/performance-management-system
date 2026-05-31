package com.pms.dto.hr.audit;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuditLogDTO {
    private UUID id;
    private UUID actorId;
    private String actorName;
    private String action;
    private String resource;
    private UUID resourceId;
    private Object oldValue;
    private Object newValue;
    private String ipAddress;
    private OffsetDateTime createdAt;
}

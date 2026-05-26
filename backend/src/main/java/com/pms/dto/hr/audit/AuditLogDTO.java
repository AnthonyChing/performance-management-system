package com.pms.dto.hr.audit;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Builder
public class AuditLogDTO {
    private UUID id;
    private UUID actorId;
    private String action;
    private String resource;
    private UUID resourceId;
    private Object oldValue;
    private Object newValue;
    private String ipAddress;
    private OffsetDateTime createdAt;
}

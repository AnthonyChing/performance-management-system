package com.pms.dto;

import com.pms.entity.Department;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String name,
        UUID parentId,
        OffsetDateTime closedAt,
        UUID closedBy,
        OffsetDateTime createdAt) {
    public static DepartmentResponse from(Department d) {
        return new DepartmentResponse(
                d.getId(),
                d.getName(),
                d.getParentId(),
                d.getClosedAt(),
                d.getClosedBy(),
                d.getCreatedAt());
    }
}

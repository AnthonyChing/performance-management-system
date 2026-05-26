package com.pms.dto.manager.appeal;

import com.pms.entity.Appeal;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Builder
public class ManagerAppealListItemDTO {
    private UUID id;
    private UUID reviewId;
    private UUID filedBy;
    private String assignedToType;
    private UUID assignedTo;
    private String reason;
    private String status;
    private OffsetDateTime filedAt;

    public static ManagerAppealListItemDTO from(Appeal a) {
        return ManagerAppealListItemDTO.builder()
                .id(a.getId())
                .reviewId(a.getReviewId())
                .filedBy(a.getFiledBy())
                .assignedToType(a.getAssignedToType() != null ? a.getAssignedToType().getDbValue() : null)
                .assignedTo(a.getAssignedTo())
                .reason(a.getReason())
                .status(a.getStatus() != null ? a.getStatus().getDbValue() : null)
                .filedAt(a.getFiledAt())
                .build();
    }
}

package com.pms.dto.manager.appeal;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pms.entity.Appeal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerAppealListItemDTO {
    private UUID id;
    private UUID reviewId;
    private String caseNo;
    private UUID filedBy;
    private String filedByName;
    private String assignedToType;
    private UUID assignedTo;
    private String assignedToName;
    private String reason;
    private String status;
    private OffsetDateTime filedAt;
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private OffsetDateTime resolvedAt;

    public static ManagerAppealListItemDTO from(Appeal a, String filedByName, String assignedToName) {
        return ManagerAppealListItemDTO.builder()
                .id(a.getId())
                .reviewId(a.getReviewId())
                .caseNo(a.getCaseNo())
                .filedBy(a.getFiledBy())
                .filedByName(filedByName)
                .assignedToType(
                        a.getAssignedToType() != null ? a.getAssignedToType().getDbValue() : null)
                .assignedTo(a.getAssignedTo())
                .assignedToName(assignedToName)
                .reason(a.getReason())
                .status(a.getStatus() != null ? a.getStatus().getDbValue() : null)
                .filedAt(a.getFiledAt())
                .resolvedAt(a.getResolvedAt())
                .build();
    }
}

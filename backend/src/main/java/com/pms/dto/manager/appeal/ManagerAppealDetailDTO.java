package com.pms.dto.manager.appeal;

import com.pms.entity.Appeal;
import com.pms.entity.AppealResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Builder
public class ManagerAppealDetailDTO {
    private UUID id;
    private UUID reviewId;
    private UUID filedBy;
    private String assignedToType;
    private UUID assignedTo;
    private String reason;
    private String status;
    private OffsetDateTime filedAt;
    private OffsetDateTime resolvedAt;
    private List<ManagerAppealResponseItemDTO> responses;

    public static ManagerAppealDetailDTO from(Appeal a, List<AppealResponse> responses) {
        return ManagerAppealDetailDTO.builder()
                .id(a.getId())
                .reviewId(a.getReviewId())
                .filedBy(a.getFiledBy())
                .assignedToType(a.getAssignedToType() != null ? a.getAssignedToType().getDbValue() : null)
                .assignedTo(a.getAssignedTo())
                .reason(a.getReason())
                .status(a.getStatus() != null ? a.getStatus().getDbValue() : null)
                .filedAt(a.getFiledAt())
                .resolvedAt(a.getResolvedAt())
                .responses(responses.stream().map(ManagerAppealResponseItemDTO::from).toList())
                .build();
    }
}

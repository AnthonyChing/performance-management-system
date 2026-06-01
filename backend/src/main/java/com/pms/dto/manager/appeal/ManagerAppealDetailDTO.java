package com.pms.dto.manager.appeal;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pms.entity.Appeal;
import com.pms.entity.AppealResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerAppealDetailDTO {
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
    private List<ManagerAppealResponseItemDTO> responses;

    public static ManagerAppealDetailDTO from(Appeal a, List<AppealResponse> responses, String filedByName, String assignedToName) {
        return ManagerAppealDetailDTO.builder()
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
                .responses(responses.stream().map(ManagerAppealResponseItemDTO::from).toList())
                .build();
    }
}

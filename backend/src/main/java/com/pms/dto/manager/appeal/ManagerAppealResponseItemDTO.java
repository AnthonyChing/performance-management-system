package com.pms.dto.manager.appeal;

import com.pms.entity.AppealResponse;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerAppealResponseItemDTO {
    private UUID id;
    private UUID respondedBy;
    private String responseText;
    private Boolean isFinal;
    private OffsetDateTime respondedAt;

    public static ManagerAppealResponseItemDTO from(AppealResponse r) {
        return ManagerAppealResponseItemDTO.builder()
                .id(r.getId())
                .respondedBy(r.getRespondedBy())
                .responseText(r.getResponseText())
                .isFinal(r.getIsFinal())
                .respondedAt(r.getRespondedAt())
                .build();
    }
}

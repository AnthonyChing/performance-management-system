package com.pms.dto.hr.evaluation;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AvailableActionsDto {
    private boolean canEdit;
    private boolean canArchive;
    private String editBlockedReason;
}

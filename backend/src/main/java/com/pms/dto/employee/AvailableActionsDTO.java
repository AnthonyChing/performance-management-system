package com.pms.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableActionsDTO {
    // Goal related
    private Boolean canEdit;
    private String editUnavailableReason;
    private Boolean canUpdateProgress;
    private String updateProgressUnavailableReason;
    private Boolean canCreateGoal;
    private String createGoalUnavailableReason;

    // KPI related
    private Boolean canConfirm;
    private String confirmUnavailableReason;
    private Boolean canDispute;
    private String disputeUnavailableReason;

    // Appeal related
    private Boolean canStartAppeal;
    private String startAppealUnavailableReason;
    private Boolean canSubmit;
    private String submitUnavailableReason;
}

package com.pms.dto.hr.assessment;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter @Builder
public class AssessmentStatusDTO {
    private UUID reviewId;
    private UUID cycleId;
    private String cycleName;
    private UUID employeeId;
    private String employeeName;
    private String department;
    private String reviewStatus;
}

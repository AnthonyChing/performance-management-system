package com.pms.dto.hr.assessment;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AssessmentStatusDTO {
    private UUID reviewId;
    private UUID cycleId;
    private String cycleName;
    private UUID employeeId;
    private String employeeName;
    private String department;
    private String reviewStatus;
    private String finalRating;
}

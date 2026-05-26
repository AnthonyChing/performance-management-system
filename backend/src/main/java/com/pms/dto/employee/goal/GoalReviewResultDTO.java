package com.pms.dto.employee.goal;

import com.pms.dto.employee.ManagerDTO;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalReviewResultDTO {
    private String goalId;
    private String title;
    private String status;
    private String decision;
    private String comment;
    private OffsetDateTime reviewedAt;
    private ManagerDTO reviewer;
}

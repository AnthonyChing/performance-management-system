package com.pms.dto.employee.goal;

import com.pms.dto.employee.ManagerDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalReviewDTO {
    private String reviewId;
    private String decision;
    private String comment;
    private OffsetDateTime reviewedAt;
    private ManagerDTO reviewer;
}

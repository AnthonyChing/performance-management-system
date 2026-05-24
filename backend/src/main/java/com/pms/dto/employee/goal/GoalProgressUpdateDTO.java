package com.pms.dto.employee.goal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalProgressUpdateDTO {
    private String progressUpdateId;
    private Integer progressPercent;
    private String note;
    private OffsetDateTime createdAt;
    private ProgressUpdateCreatorDTO createdBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressUpdateCreatorDTO {
        private String userId;
        private String name;
    }
}

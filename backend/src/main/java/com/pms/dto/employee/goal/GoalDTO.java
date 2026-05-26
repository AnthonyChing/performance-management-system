package com.pms.dto.employee.goal;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.ManagerDTO;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalDTO {
    private String goalId;
    private String cycleId;
    private String goalType;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;
    private Integer progressPercent;
    private GoalOwnerDTO owner;
    private ManagerDTO reviewer;
    private GoalProgressUpdateDTO latestProgressUpdate;
    private GoalReviewDTO latestReview;
    private AvailableActionsDTO availableActions;
    private OffsetDateTime publishedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoalOwnerDTO {
        private String userId;
        private String name;
        private String department;
    }
}

package com.pms.dto.manager.goal;

import com.pms.entity.Goal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ManagerGoalResponseDTO {
    private UUID goalId;
    private UUID cycleId;
    private UUID ownerId;
    private UUID setBy;
    private String goalType;
    private String title;
    private String description;
    private Integer progressPercent;
    private LocalDate dueDate;
    private String status;
    private OffsetDateTime publishedAt;

    public static ManagerGoalResponseDTO from(Goal g) {
        return ManagerGoalResponseDTO.builder()
                .goalId(g.getId())
                .cycleId(g.getCycleId())
                .ownerId(g.getOwnerId())
                .setBy(g.getSetBy())
                .goalType(g.getGoalType() != null ? g.getGoalType().getDbValue() : null)
                .title(g.getTitle())
                .description(g.getDescription())
                .progressPercent(g.getProgressPercent())
                .dueDate(g.getDueDate())
                .status(g.getStatus() != null ? g.getStatus().getDbValue() : null)
                .publishedAt(g.getPublishedAt())
                .build();
    }
}

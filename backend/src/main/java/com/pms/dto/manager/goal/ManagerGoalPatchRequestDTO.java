package com.pms.dto.manager.goal;

import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ManagerGoalPatchRequestDTO {
    private String status;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String managerComment;
}

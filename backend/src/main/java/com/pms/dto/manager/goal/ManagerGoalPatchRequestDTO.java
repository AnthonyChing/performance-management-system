package com.pms.dto.manager.goal;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor
public class ManagerGoalPatchRequestDTO {
    private String status;
    private String title;
    private String description;
    private LocalDate dueDate;
}

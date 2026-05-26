package com.pms.dto.manager.goal;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor
public class ManagerGoalCreateRequestDTO {
    @NotBlank
    private String title;
    private String description;
    private String goalType;
    private LocalDate dueDate;
}

package com.pms.dto.manager.goal;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ManagerGoalCreateRequestDTO {
    @NotBlank private String title;
    private String description;
    private String goalType;
    private LocalDate dueDate;
}

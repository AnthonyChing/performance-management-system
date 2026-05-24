package com.pms.dto.employee.goal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalProgressUpdateRequestDTO {
    private Integer progressPercent;
    private String note;
}

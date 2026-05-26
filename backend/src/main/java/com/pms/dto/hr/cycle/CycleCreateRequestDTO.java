package com.pms.dto.hr.cycle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor
public class CycleCreateRequestDTO {
    @NotBlank
    private String name;
    @NotNull
    private String cycleType;
    private String timezone = "Asia/Taipei";

    // Self-eval dates are optional; if omitted, reviews skip self-eval phase
    private OffsetDateTime selfEvalStart;
    private OffsetDateTime selfEvalEnd;

    @NotNull private OffsetDateTime managerEvalStart;
    @NotNull private OffsetDateTime managerEvalEnd;
    @NotNull private OffsetDateTime hrReviewEnd;

    private Integer appealDeadlineDays = 7;
}

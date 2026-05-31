package com.pms.dto.hr.cycle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CycleCreateRequestDTO {
    @NotBlank private String name;
    @NotNull private String cycleType;
    private String timezone = "Asia/Taipei";

    @NotNull private OffsetDateTime cycleStart;
    @NotNull private OffsetDateTime cycleEnd;

    @NotNull private OffsetDateTime managerEvalStart;
    @NotNull private OffsetDateTime managerEvalEnd;
    @NotNull private OffsetDateTime hrReviewEnd;

    private Integer appealDeadlineDays = 7;
}

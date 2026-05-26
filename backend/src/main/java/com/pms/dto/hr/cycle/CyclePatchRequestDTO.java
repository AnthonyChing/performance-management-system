package com.pms.dto.hr.cycle;

import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CyclePatchRequestDTO {
    private String name;
    private String timezone;
    private OffsetDateTime selfEvalStart;
    private OffsetDateTime selfEvalEnd;
    private OffsetDateTime managerEvalStart;
    private OffsetDateTime managerEvalEnd;
    private OffsetDateTime hrReviewEnd;
    private Integer appealDeadlineDays;
}

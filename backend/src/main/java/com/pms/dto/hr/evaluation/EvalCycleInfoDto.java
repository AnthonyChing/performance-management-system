package com.pms.dto.hr.evaluation;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EvalCycleInfoDto {
    private UUID cycleId;
    private String name;
    private String cycleType;
    private String status;
}

package com.pms.dto.employee.profile;

import com.pms.dto.employee.CycleSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentCycleResponseDTO {
    private CycleSummaryDTO cycle;
}

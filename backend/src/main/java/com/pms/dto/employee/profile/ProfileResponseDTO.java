package com.pms.dto.employee.profile;

import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.ProfileDTO;
import com.pms.dto.employee.ReviewSummaryDTO;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponseDTO {
    private ProfileDTO profile;
    private CycleSummaryDTO cycle;
    private ReviewSummaryDTO review;
    private List<String> roles;
}

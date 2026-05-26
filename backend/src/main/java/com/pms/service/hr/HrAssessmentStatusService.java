package com.pms.service.hr;

import com.pms.dto.hr.assessment.AssessmentStatusDTO;
import org.springframework.data.domain.Page;

public interface HrAssessmentStatusService {

    Page<AssessmentStatusDTO> listAssessmentStatuses(
            String cycleId, String employeeId, String reviewStatus, int page, int pageSize);
}

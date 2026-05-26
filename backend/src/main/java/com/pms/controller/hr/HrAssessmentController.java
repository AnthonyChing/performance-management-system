package com.pms.controller.hr;

import com.pms.dto.hr.assessment.AssessmentStatusDTO;
import com.pms.service.hr.HrAssessmentStatusService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr/assessment-statuses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrAssessmentController {

    private final HrAssessmentStatusService assessmentStatusService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listAssessmentStatuses(
            @RequestParam(name = "cycle_id", required = false) String cycleId,
            @RequestParam(name = "employee_id", required = false) String employeeId,
            @RequestParam(name = "review_status", required = false) String reviewStatus,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize) {
        Page<AssessmentStatusDTO> result =
                assessmentStatusService.listAssessmentStatuses(
                        cycleId, employeeId, reviewStatus, page, pageSize);
        return ResponseEntity.ok(
                Map.of(
                        "data", result.getContent(),
                        "meta",
                                Map.of(
                                        "current_page", result.getNumber() + 1,
                                        "total_pages", result.getTotalPages(),
                                        "total_count", result.getTotalElements())));
    }
}

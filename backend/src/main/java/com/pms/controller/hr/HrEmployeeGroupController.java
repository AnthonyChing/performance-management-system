package com.pms.controller.hr;

import com.pms.dto.hr.evaluation.EmployeeGroupDto;
import com.pms.service.hr.HrEvaluationTemplateService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr/employee-groups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrEmployeeGroupController {

    private final HrEvaluationTemplateService evalTemplateService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEmployeeGroups() {
        List<EmployeeGroupDto> groups = evalTemplateService.getEmployeeGroups();
        return ResponseEntity.ok(Map.of("data", groups));
    }
}

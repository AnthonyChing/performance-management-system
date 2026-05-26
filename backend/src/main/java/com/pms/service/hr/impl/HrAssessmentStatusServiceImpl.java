package com.pms.service.hr.impl;

import com.pms.dto.hr.assessment.AssessmentStatusDTO;
import com.pms.entity.Department;
import com.pms.entity.PerformanceCycle;
import com.pms.entity.PerformanceReview;
import com.pms.entity.User;
import com.pms.repository.DepartmentRepository;
import com.pms.repository.PerformanceCycleRepository;
import com.pms.repository.PerformanceReviewRepository;
import com.pms.repository.UserRepository;
import com.pms.service.hr.HrAssessmentStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HrAssessmentStatusServiceImpl implements HrAssessmentStatusService {

    private final PerformanceReviewRepository reviewRepo;
    private final PerformanceCycleRepository cycleRepo;
    private final UserRepository userRepo;
    private final DepartmentRepository departmentRepo;

    @Override
    public Page<AssessmentStatusDTO> listAssessmentStatuses(
            String cycleId, String employeeId, String reviewStatus, int page, int pageSize) {

        Page<PerformanceReview> reviews = reviewRepo.findFiltered(
                cycleId, employeeId, reviewStatus, PageRequest.of(page - 1, pageSize));

        // Pre-fetch referenced entities to avoid N+1
        List<UUID> cycleIds = reviews.stream().map(PerformanceReview::getCycleId).distinct().toList();
        List<UUID> employeeIds = reviews.stream().map(PerformanceReview::getEmployeeId).distinct().toList();

        Map<UUID, PerformanceCycle> cycleMap = new HashMap<>();
        cycleRepo.findAllById(cycleIds).forEach(c -> cycleMap.put(c.getId(), c));

        Map<UUID, User> userMap = new HashMap<>();
        userRepo.findAllById(employeeIds).forEach(u -> userMap.put(u.getId(), u));

        List<UUID> deptIds = userMap.values().stream().map(User::getDepartmentId).distinct().toList();
        Map<UUID, Department> deptMap = new HashMap<>();
        departmentRepo.findAllById(deptIds).forEach(d -> deptMap.put(d.getId(), d));

        return reviews.map(review -> {
            PerformanceCycle cycle = cycleMap.get(review.getCycleId());
            User employee = userMap.get(review.getEmployeeId());
            Department dept = employee != null ? deptMap.get(employee.getDepartmentId()) : null;

            return AssessmentStatusDTO.builder()
                    .reviewId(review.getId())
                    .cycleId(review.getCycleId())
                    .cycleName(cycle != null ? cycle.getName() : null)
                    .employeeId(review.getEmployeeId())
                    .employeeName(employee != null ? employee.getFullName() : null)
                    .department(dept != null ? dept.getName() : null)
                    .reviewStatus(review.getStatus().getDbValue())
                    .build();
        });
    }
}

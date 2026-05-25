package com.pms.service.employee.impl;

import com.pms.dto.employee.DepartmentDTO;
import com.pms.dto.employee.ManagerDTO;
import com.pms.dto.employee.ProfileDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.ReviewSummaryDTO;
import com.pms.dto.employee.profile.CurrentCycleResponseDTO;
import com.pms.dto.employee.profile.ProfileResponseDTO;
import com.pms.service.employee.EmployeeProfileService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class EmployeeProfileServiceImpl implements EmployeeProfileService {

    @Override
    public ProfileResponseDTO getProfile(String userId) {
        ManagerDTO manager = ManagerDTO.builder()
                .userId("user_manager_001")
                .name("林美玲")
                .englishName("Mei Lin")
                .email("mei.lin@performanceplus.com")
                .build();

        ProfileDTO profile = ProfileDTO.builder()
                .userId(userId != null ? userId : "user_001")
                .employeeId("PP-88293")
                .name("陳大文")
                .englishName("David Chen")
                .avatarUrl("/assets/avatar/PP-88293.png")
                .jobTitle("資深軟體工程師")
                .jobCategory("engineering")
                .department(DepartmentDTO.builder().departmentId("dept_engineering").name("技術研發部").build())
                .location("台北總部")
                .email("david.chen@performanceplus.com")
                .employmentStatus("active")
                .manager(manager)
                .build();

        CycleSummaryDTO cycle = CycleSummaryDTO.builder()
                .cycleId("cycle_2024_q3")
                .name("2024 Q3 年度績效考核")
                .cycleType("quarterly")
                .periodLabel("2024-07-01~2024-09-30")
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 9, 30))
                .timezone("Asia/Taipei")
                .status("in_progress")
                .isLocked(false)
                .updatedAt(OffsetDateTime.of(2024, 9, 20, 10, 30, 0, 0, ZoneOffset.ofHours(8)))
                .build();

        ReviewSummaryDTO review = ReviewSummaryDTO.builder()
                .reviewId("review_2024_q3_user_001")
                .status("pending_manager_eval")
                .manager(ManagerDTO.builder()
                        .userId("user_manager_001")
                        .name("林美玲")
                        .englishName("Mei Lin")
                        .build())
                .submittedAt(OffsetDateTime.of(2024, 8, 30, 18, 20, 0, 0, ZoneOffset.ofHours(8)))
                .updatedAt(OffsetDateTime.of(2024, 8, 30, 18, 20, 0, 0, ZoneOffset.ofHours(8)))
                .build();

        return ProfileResponseDTO.builder()
                .profile(profile)
                .cycle(cycle)
                .review(review)
                .build();
    }

    @Override
    public CurrentCycleResponseDTO getCurrentCycle(String userId) {
        CycleSummaryDTO cycle = CycleSummaryDTO.builder()
                .cycleId("cycle_2024_q3")
                .name("2024 Q3 年度績效考核")
                .cycleType("quarterly")
                .periodLabel("2024-07-01~2024-09-30")
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 9, 30))
                .timezone("Asia/Taipei")
                .status("results_published")
                .isLocked(true)
                .resultsPublishedAt(OffsetDateTime.of(2024, 10, 15, 17, 0, 0, 0, ZoneOffset.ofHours(8)))
                .updatedAt(OffsetDateTime.of(2024, 10, 15, 17, 0, 0, 0, ZoneOffset.ofHours(8)))
                .build();

        return CurrentCycleResponseDTO.builder()
                .cycle(cycle)
                .build();
    }
}

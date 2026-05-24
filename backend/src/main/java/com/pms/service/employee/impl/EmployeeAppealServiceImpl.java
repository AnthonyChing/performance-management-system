package com.pms.service.employee.impl;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.appeal.AppealDTO;
import com.pms.dto.employee.appeal.AppealResponsesDTO.*;
import com.pms.dto.employee.kpi.KpiResultSummaryDTO.DisputePeriodDTO;
import com.pms.service.employee.EmployeeAppealService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class EmployeeAppealServiceImpl implements EmployeeAppealService {

    @Override
    public AppealsResponseDTO getAppeals(String userId) {
        return AppealsResponseDTO.builder()
                .mode("compose")
                .period(buildCycleSummary())
                .appealPeriod(DisputePeriodDTO.builder().status("open").startDate("2025-10-15").endDate("2025-10-22").timezone("Asia/Taipei").build())
                .reviewResult(buildReviewResult())
                .currentAppeal(null)
                .availableActions(AvailableActionsDTO.builder().canStartAppeal(true).canSubmit(true).build())
                .build();
    }

    @Override
    public AppealSubmitResponseDTO submitAppeal(String userId, AppealSubmitRequestDTO request) {
        AppealDTO appeal = AppealDTO.builder()
                .appealId("appeal_20251016_004")
                .caseNo("DP-20251016-004")
                .reviewId("review_2025_q3_user_001")
                .period(buildCycleSummary())
                .reason(request.getReason())
                .status("submitted")
                .submittedAt(OffsetDateTime.now())
                .handler(AppealDTO.AppealHandlerDTO.builder().userId("hr_001").type("hr").name("陳美玲").englishName("Lin Chen").department("HR 部門").build())
                .isFinalResponse(false)
                .updatedAt(OffsetDateTime.now())
                .build();

        return AppealSubmitResponseDTO.builder()
                .appeal(appeal)
                .availableActions(AvailableActionsDTO.builder().canStartAppeal(false).startAppealUnavailableReason("already_submitted").canSubmit(false).submitUnavailableReason("already_submitted").build())
                .build();
    }

    @Override
    public AppealResultResponseDTO getAppealResult(String userId) {
        AppealDTO appeal = AppealDTO.builder()
                .appealId("appeal_20251016_004")
                .caseNo("DP-20251016-004")
                .reviewId("review_2025_q3_user_001")
                .period(buildCycleSummary())
                .reason("本人對於 Q3 考核中「專案領導力」項目的評分持有異議。")
                .status("approved")
                .submittedAt(OffsetDateTime.of(2025, 10, 16, 9, 42, 0, 0, ZoneOffset.ofHours(8)))
                .resolvedAt(OffsetDateTime.of(2025, 10, 20, 15, 20, 0, 0, ZoneOffset.ofHours(8)))
                .handler(AppealDTO.AppealHandlerDTO.builder().userId("hr_001").type("hr").name("陳美玲").englishName("Lin Chen").department("HR 部門").build())
                .processingComment("經複核專案資料與主管回覆後，本次異議成立，HR 將同步更新本期考核結果。")
                .processingCommentUpdatedAt(OffsetDateTime.of(2025, 10, 20, 15, 20, 0, 0, ZoneOffset.ofHours(8)))
                .isFinalResponse(true)
                .updatedAt(OffsetDateTime.of(2025, 10, 20, 15, 20, 0, 0, ZoneOffset.ofHours(8)))
                .build();

        return AppealResultResponseDTO.builder()
                .appeal(appeal)
                .reviewResult(buildReviewResult())
                .build();
    }

    private CycleSummaryDTO buildCycleSummary() {
        return CycleSummaryDTO.builder()
                .cycleId("cycle_2025_q3")
                .name("2025 年度 Q3 績效考核")
                .startDate(LocalDate.of(2025, 7, 1))
                .endDate(LocalDate.of(2025, 9, 30))
                .build();
    }

    private AppealReviewResultDTO buildReviewResult() {
        return AppealReviewResultDTO.builder()
                .reviewId("review_2025_q3_user_001")
                .finalRating("meets_expectations")
                .kpiScore(86.5)
                .reviewScore(82.0)
                .managerComment("整體表現穩定，專案推進能力良好。")
                .build();
    }
}

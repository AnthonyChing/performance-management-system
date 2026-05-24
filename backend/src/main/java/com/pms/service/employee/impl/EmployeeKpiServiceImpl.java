package com.pms.service.employee.impl;

import com.pms.dto.employee.AvailableActionsDTO;
import com.pms.dto.employee.CycleSummaryDTO;
import com.pms.dto.employee.PaginationDTO;
import com.pms.dto.employee.kpi.*;
import com.pms.dto.employee.kpi.KpiResponsesDTO.*;
import com.pms.service.employee.EmployeeKpiService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class EmployeeKpiServiceImpl implements EmployeeKpiService {

    @Override
    public KpiStandardsResponseDTO getKpiStandards(String userId) {
        return KpiStandardsResponseDTO.builder()
                .cycle(buildCycleSummary())
                .employee(buildEmployeeSummary(userId))
                .standards(List.of(buildKpiStandard()))
                .build();
    }

    @Override
    public KpiResultResponseDTO getKpiResult(String userId) {
        KpiResultSummaryDTO result = buildKpiResultSummary(userId);
        return KpiResultResponseDTO.builder().result(result).build();
    }

    @Override
    public KpiConfirmationResponseDTO confirmKpiResult(String userId, KpiConfirmationRequestDTO request) {
        KpiResultSummaryDTO result = buildKpiResultSummary(userId);
        result.setStatus("confirmed");
        result.getAvailableActions().setCanConfirm(false);
        result.getAvailableActions().setConfirmUnavailableReason("already_confirmed");

        KpiResultSummaryDTO.KpiConfirmationDTO confirmation = KpiResultSummaryDTO.KpiConfirmationDTO.builder()
                .confirmationId("kpi_confirmation_001")
                .resultId(request.getResultId())
                .confirmedAt(OffsetDateTime.now())
                .confirmedBy(buildEmployeeSummary(userId))
                .build();
        
        result.setConfirmation(confirmation);

        return KpiConfirmationResponseDTO.builder()
                .confirmation(confirmation)
                .result(result)
                .build();
    }

    @Override
    public HistoricalKpiResultsResponseDTO getHistoricalKpiResults(String userId, Integer page, Integer pageSize, String q, String cycleId) {
        if (cycleId == null) {
            KpiResultSummaryDTO resultSummary = KpiResultSummaryDTO.builder()
                    .resultId("kpi_result_2023_q4_user_001")
                    .cycle(buildCycleSummary())
                    .performanceScore(94.5)
                    .weightedScore(104.3)
                    .finalGrade("A")
                    .build();

            return HistoricalKpiResultsResponseDTO.builder()
                    .mode("historical_results")
                    .pagination(PaginationDTO.builder().page(1).pageSize(4).totalPages(5).totalCount(20).hasPrevious(false).hasNext(true).build())
                    .results(List.of(resultSummary))
                    .build();
        } else {
            return HistoricalKpiResultsResponseDTO.builder()
                    .mode("historical_result_detail")
                    .standards(List.of(buildKpiStandard()))
                    .result(buildKpiResultSummary(userId))
                    .build();
        }
    }

    private CycleSummaryDTO buildCycleSummary() {
        return CycleSummaryDTO.builder()
                .cycleId("cycle_2024_q3")
                .name("2024 年度 Q3 績效指標與評估")
                .periodLabel("2024 年度 Q3")
                .reviewType("績效考核")
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 9, 30))
                .build();
    }

    private KpiResultSummaryDTO.EmployeeSummaryDTO buildEmployeeSummary(String userId) {
        return KpiResultSummaryDTO.EmployeeSummaryDTO.builder()
                .userId(userId != null ? userId : "user_001")
                .name("王大明")
                .department("System Management")
                .build();
    }

    private KpiStandardDTO buildKpiStandard() {
        return KpiStandardDTO.builder()
                .kpiId("kpi_core_product_quality")
                .name("核心產品開發進度")
                .description("準時完成 Q3 路線圖中的 A、B 模組。")
                .weightPercent(40)
                .target(KpiStandardDTO.KpiTargetDTO.builder()
                        .operator("gte")
                        .value(95.0)
                        .unit("percent")
                        .displayText("通過率 >= 95%")
                        .build())
                .build();
    }

    private KpiResultSummaryDTO buildKpiResultSummary(String userId) {
        KpiResultDTO kpiResult = KpiResultDTO.builder()
                .kpiId("kpi_core_product_quality")
                .name("核心產品開發進度")
                .weightPercent(40)
                .actual(KpiResultDTO.KpiActualDTO.builder().value(5.0).unit("module").displayText("5").build())
                .target(KpiStandardDTO.KpiTargetDTO.builder().value(4.0).unit("module").displayText("4").build())
                .achievementPercent(125.0)
                .score(50.0)
                .latestSnapshot(KpiResultDTO.KpiSnapshotDTO.builder()
                        .snapshotId("kpi_snapshot_001")
                        .value(5.0)
                        .note("Q3 已完成 5 個模組並完成驗收。")
                        .recordedAt(OffsetDateTime.of(2025, 10, 10, 18, 0, 0, 0, ZoneOffset.ofHours(8)))
                        .build())
                .build();

        return KpiResultSummaryDTO.builder()
                .resultId("kpi_result_2024_q3_user_001")
                .cycle(buildCycleSummary())
                .employee(buildEmployeeSummary(userId))
                .status("pending_confirmation")
                .publishedAt(OffsetDateTime.of(2025, 10, 15, 17, 0, 0, 0, ZoneOffset.ofHours(8)))
                .scoreSummary(KpiResultSummaryDTO.ScoreSummaryDTO.builder().performanceScore(94.5).kpiAchievementPercent(103.6).managerReviewScore(88.0).build())
                .weightedScore(103.6)
                .reviewScore(88.0)
                .managerEvaluation(KpiResultSummaryDTO.ManagerEvaluationDTO.builder().score(88.0).comment("技術執行力強").build())
                .kpiResults(List.of(kpiResult))
                .availableActions(AvailableActionsDTO.builder().canConfirm(true).canDispute(false).disputeUnavailableReason("not_open").build())
                .disputePeriod(KpiResultSummaryDTO.DisputePeriodDTO.builder().status("not_open").startDate("2025-10-16").endDate("2025-10-20").build())
                .reviewedAt(OffsetDateTime.of(2025, 10, 15, 17, 0, 0, 0, ZoneOffset.ofHours(8)))
                .updatedAt(OffsetDateTime.of(2025, 10, 15, 17, 0, 0, 0, ZoneOffset.ofHours(8)))
                .build();
    }
}

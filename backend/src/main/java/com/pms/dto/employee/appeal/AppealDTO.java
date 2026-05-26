package com.pms.dto.employee.appeal;

import com.pms.dto.employee.CycleSummaryDTO;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppealDTO {
    private String appealId;
    private String caseNo;
    private String reviewId;
    private CycleSummaryDTO period;
    private String reason;
    private String status;
    private OffsetDateTime submittedAt;
    private OffsetDateTime resolvedAt;
    private AppealHandlerDTO handler;
    private String processingComment;
    private OffsetDateTime processingCommentUpdatedAt;
    private Boolean isFinalResponse;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppealHandlerDTO {
        private String userId;
        private String type;
        private String name;
        private String englishName;
        private String department;
    }
}

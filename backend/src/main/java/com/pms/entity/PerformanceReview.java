package com.pms.entity;

import com.pms.entity.converter.ReviewStatusConverter;
import com.pms.entity.enums.RatingScale;
import com.pms.entity.enums.ReviewStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "performance_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceReview {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "cycle_id", nullable = false)
    private UUID cycleId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "manager_id", nullable = false)
    private UUID managerId;

    @Column(name = "co_manager_id")
    private UUID coManagerId;

    @Column(name = "template_version_id")
    private UUID templateVersionId;

    @Convert(converter = ReviewStatusConverter.class)
    @Column(name = "status", nullable = false, columnDefinition = "review_status_enum")
    private ReviewStatus status;

    @Column(name = "self_submitted_at")
    private OffsetDateTime selfSubmittedAt;

    @Column(name = "self_withdrawn_at")
    private OffsetDateTime selfWithdrawnAt;

    @Column(name = "manager_submitted_at")
    private OffsetDateTime managerSubmittedAt;

    @Column(name = "hr_approved_at")
    private OffsetDateTime hrApprovedAt;

    // Note: finalRating encrypts an Enum, which requires the DB column to be VARCHAR, not
    // rating_scale_enum
    @Convert(converter = com.pms.security.crypto.RatingScaleCryptoConverter.class)
    @Column(name = "final_rating", columnDefinition = "VARCHAR(255)")
    private RatingScale finalRating;

    @Convert(converter = com.pms.security.crypto.CryptoConverter.class)
    @Column(name = "manager_comment", columnDefinition = "TEXT")
    private String managerComment;

    @Convert(converter = com.pms.security.crypto.BigDecimalCryptoConverter.class)
    @Column(name = "kpi_score", columnDefinition = "VARCHAR(255)")
    private BigDecimal kpiScore;

    @Convert(converter = com.pms.security.crypto.BigDecimalCryptoConverter.class)
    @Column(name = "review_score", columnDefinition = "VARCHAR(255)")
    private BigDecimal reviewScore;

    @Column(name = "score_computed_at")
    private OffsetDateTime scoreComputedAt;

    @Column(name = "is_terminated_employee", nullable = false)
    private Boolean isTerminatedEmployee;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}

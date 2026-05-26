package com.pms.entity;

import com.pms.entity.converter.RatingScaleConverter;
import com.pms.entity.converter.ReviewStatusConverter;
import com.pms.entity.enums.RatingScale;
import com.pms.entity.enums.ReviewStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

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

    @Convert(converter = RatingScaleConverter.class)
    @Column(name = "final_rating", columnDefinition = "rating_scale_enum")
    private RatingScale finalRating;

    @Column(name = "manager_comment", columnDefinition = "TEXT")
    private String managerComment;

    @Column(name = "kpi_score", precision = 6, scale = 2)
    private BigDecimal kpiScore;

    @Column(name = "review_score", precision = 6, scale = 2)
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

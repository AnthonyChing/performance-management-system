package com.pms.entity;

import com.pms.entity.converter.CycleStatusConverter;
import com.pms.entity.converter.CycleTypeConverter;
import com.pms.entity.enums.CycleStatus;
import com.pms.entity.enums.CycleType;
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

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "performance_cycles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceCycle {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Convert(converter = CycleTypeConverter.class)
    @Column(name = "cycle_type", nullable = false, columnDefinition = "cycle_type_enum")
    private CycleType cycleType;

    @Convert(converter = CycleStatusConverter.class)
    @Column(name = "status", nullable = false, columnDefinition = "cycle_status_enum")
    private CycleStatus status;

    @Column(name = "timezone", nullable = false)
    private String timezone;

    @Column(name = "self_eval_start", nullable = false)
    private OffsetDateTime selfEvalStart;

    @Column(name = "self_eval_end", nullable = false)
    private OffsetDateTime selfEvalEnd;

    @Column(name = "manager_eval_start", nullable = false)
    private OffsetDateTime managerEvalStart;

    @Column(name = "manager_eval_end", nullable = false)
    private OffsetDateTime managerEvalEnd;

    @Column(name = "hr_review_end", nullable = false)
    private OffsetDateTime hrReviewEnd;

    @Column(name = "results_published_at")
    private OffsetDateTime resultsPublishedAt;

    @Column(name = "appeal_deadline_days", nullable = false)
    private Integer appealDeadlineDays;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}

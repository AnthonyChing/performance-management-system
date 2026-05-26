package com.pms.entity;

import com.pms.entity.converter.GoalTypeConverter;
import com.pms.entity.enums.GoalType;
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
@Table(name = "kpis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kpi {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "cycle_id", nullable = false)
    private UUID cycleId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Convert(converter = GoalTypeConverter.class)
    @Column(name = "kpi_type", nullable = false, columnDefinition = "goal_type_enum")
    private GoalType kpiType;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit", length = 32)
    private String unit;

    @Column(name = "target_operator", length = 16)
    private String targetOperator;

    @Column(name = "target_value", precision = 15, scale = 4)
    private BigDecimal targetValue;

    @Column(name = "target_unit", length = 32)
    private String targetUnit;

    @Column(name = "target_display_text", length = 255)
    private String targetDisplayText;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}

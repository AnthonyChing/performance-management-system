package com.pms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "kpi_assignments")
@IdClass(KpiAssignmentId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiAssignment {

    @Id
    @Column(name = "kpi_id", nullable = false)
    private UUID kpiId;

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "weight", nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "target_value", nullable = false, precision = 15, scale = 4)
    private BigDecimal targetValue;

    @Column(name = "current_value", precision = 15, scale = 4)
    private BigDecimal currentValue;

    @Column(name = "last_updated_at")
    private OffsetDateTime lastUpdatedAt;
}

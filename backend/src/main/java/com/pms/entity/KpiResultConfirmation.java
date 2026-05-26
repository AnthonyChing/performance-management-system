package com.pms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "kpi_result_confirmations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiResultConfirmation {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "review_id", nullable = false, unique = true)
    private UUID reviewId;

    @Column(name = "confirmed_by", nullable = false)
    private UUID confirmedBy;

    @Column(name = "confirmed_at", nullable = false)
    private OffsetDateTime confirmedAt;
}

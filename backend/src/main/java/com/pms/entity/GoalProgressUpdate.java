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
@Table(name = "goal_progress_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalProgressUpdate {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "goal_id", nullable = false)
    private UUID goalId;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "updated_by", nullable = false)
    private UUID updatedBy;

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;
}

package com.pms.entity;

import com.pms.entity.converter.GoalStatusConverter;
import com.pms.entity.converter.GoalTypeConverter;
import com.pms.entity.enums.GoalStatus;
import com.pms.entity.enums.GoalType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
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
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "cycle_id", nullable = false)
    private UUID cycleId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "set_by", nullable = false)
    private UUID setBy;

    @Convert(converter = GoalTypeConverter.class)
    @Column(name = "goal_type", nullable = false, columnDefinition = "goal_type_enum")
    private GoalType goalType;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Convert(converter = GoalStatusConverter.class)
    @Column(name = "status", nullable = false, columnDefinition = "goal_status_enum")
    private GoalStatus status;

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

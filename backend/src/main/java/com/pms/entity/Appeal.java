package com.pms.entity;

import com.pms.entity.converter.AppealAssigneeConverter;
import com.pms.entity.converter.AppealStatusConverter;
import com.pms.entity.enums.AppealAssignee;
import com.pms.entity.enums.AppealStatus;
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

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "appeals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appeal {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "review_id", nullable = false, unique = true)
    private UUID reviewId;

    @Column(name = "case_no", nullable = false, unique = true, length = 32)
    private String caseNo;

    @Column(name = "filed_by", nullable = false)
    private UUID filedBy;

    @Convert(converter = AppealAssigneeConverter.class)
    @Column(name = "assigned_to_type", nullable = false, columnDefinition = "appeal_assignee_enum")
    private AppealAssignee assignedToType;

    @Column(name = "assigned_to", nullable = false)
    private UUID assignedTo;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Convert(converter = AppealStatusConverter.class)
    @Column(name = "status", nullable = false, columnDefinition = "appeal_status_enum")
    private AppealStatus status;

    @Column(name = "filed_at", nullable = false)
    private OffsetDateTime filedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}

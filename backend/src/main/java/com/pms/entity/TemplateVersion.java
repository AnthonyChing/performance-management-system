package com.pms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "template_versions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplateVersion {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

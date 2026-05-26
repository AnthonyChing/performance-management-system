package com.pms.entity;

import com.pms.entity.converter.IdentityProviderConverter;
import com.pms.entity.enums.IdentityProvider;
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
@Table(name = "user_identities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserIdentity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Convert(converter = IdentityProviderConverter.class)
    @Column(name = "provider", nullable = false, columnDefinition = "identity_provider_enum")
    private IdentityProvider provider;

    @Column(name = "provider_subject", nullable = false)
    private String providerSubject;

    @Column(name = "provider_email")
    private String providerEmail;

    @Column(name = "linked_at", nullable = false, updatable = false)
    private OffsetDateTime linkedAt;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;
}

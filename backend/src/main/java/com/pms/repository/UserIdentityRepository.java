package com.pms.repository;

import com.pms.entity.UserIdentity;
import com.pms.entity.enums.IdentityProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, UUID> {

    Optional<UserIdentity> findByProviderAndProviderSubject(IdentityProvider provider, String providerSubject);
}

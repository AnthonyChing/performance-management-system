package com.pms.repository;

import com.pms.entity.UserIdentity;
import com.pms.entity.enums.IdentityProvider;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, UUID> {

    Optional<UserIdentity> findByProviderAndProviderSubject(
            IdentityProvider provider, String providerSubject);
}

package com.pms.repository;

import com.pms.entity.UserIdentity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, UUID> {

    @Query(
            value =
                    "SELECT * FROM user_identities"
                        + " WHERE provider = CAST(:provider AS identity_provider_enum)"
                        + " AND provider_subject = :subject",
            nativeQuery = true)
    Optional<UserIdentity> findByProviderAndProviderSubject(
            @Param("provider") String provider, @Param("subject") String providerSubject);
}

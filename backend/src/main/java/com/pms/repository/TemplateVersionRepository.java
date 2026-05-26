package com.pms.repository;

import com.pms.entity.TemplateVersion;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateVersionRepository extends JpaRepository<TemplateVersion, UUID> {

    Optional<TemplateVersion> findTopByTemplateIdOrderByVersionDesc(UUID templateId);
}

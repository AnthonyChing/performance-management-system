package com.pms.repository;

import com.pms.entity.TemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TemplateVersionRepository extends JpaRepository<TemplateVersion, UUID> {

    Optional<TemplateVersion> findTopByTemplateIdOrderByVersionDesc(UUID templateId);
}

package com.pms.repository;

import com.pms.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, AuditLog.AuditLogId> {

    @Query(value = """
            SELECT * FROM audit_logs
            WHERE (:action IS NULL OR action = :action)
              AND (:resource IS NULL OR resource = :resource)
              AND (:actorId IS NULL OR actor_id = CAST(:actorId AS uuid))
              AND (CAST(:from AS timestamptz) IS NULL OR created_at >= CAST(:from AS timestamptz))
              AND (CAST(:to AS timestamptz) IS NULL OR created_at <= CAST(:to AS timestamptz))
            ORDER BY created_at DESC
            """,
            countQuery = """
            SELECT count(*) FROM audit_logs
            WHERE (:action IS NULL OR action = :action)
              AND (:resource IS NULL OR resource = :resource)
              AND (:actorId IS NULL OR actor_id = CAST(:actorId AS uuid))
              AND (CAST(:from AS timestamptz) IS NULL OR created_at >= CAST(:from AS timestamptz))
              AND (CAST(:to AS timestamptz) IS NULL OR created_at <= CAST(:to AS timestamptz))
            """,
            nativeQuery = true)
    Page<AuditLog> findFiltered(
            @Param("action") String action,
            @Param("resource") String resource,
            @Param("actorId") String actorId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            Pageable pageable);
}

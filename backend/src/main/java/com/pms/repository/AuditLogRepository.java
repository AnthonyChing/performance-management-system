package com.pms.repository;

import com.pms.entity.AuditLog;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, AuditLog.AuditLogId> {

    @Query(
            value =
                    """
            SELECT * FROM audit_logs
            WHERE (CAST(:action AS text) IS NULL OR action = :action)
              AND (CAST(:resource AS text) IS NULL OR resource = :resource)
              AND (CAST(:actorId AS text) IS NULL OR actor_id = CAST(:actorId AS uuid))
              AND (CAST(:from AS timestamptz) IS NULL OR created_at >= CAST(:from AS timestamptz))
              AND (CAST(:to AS timestamptz) IS NULL OR created_at <= CAST(:to AS timestamptz))
            ORDER BY created_at DESC
            """,
            countQuery =
                    """
            SELECT count(*) FROM audit_logs
            WHERE (CAST(:action AS text) IS NULL OR action = :action)
              AND (CAST(:resource AS text) IS NULL OR resource = :resource)
              AND (CAST(:actorId AS text) IS NULL OR actor_id = CAST(:actorId AS uuid))
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

package com.pms.controller.hr;

import com.pms.dto.hr.audit.AuditLogDTO;
import com.pms.service.hr.HrAuditLogService;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrAuditLogController {

    private final HrAuditLogService auditLogService;

    @GetMapping("/audit-logs")
    public ResponseEntity<Map<String, Object>> listAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resource,
            @RequestParam(name = "actor_id", required = false) UUID actorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    OffsetDateTime to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize) {
        Page<AuditLogDTO> result =
                auditLogService.listAuditLogs(action, resource, actorId, from, to, page, pageSize);
        return ResponseEntity.ok(
                Map.of(
                        "data", result.getContent(),
                        "meta",
                                Map.of(
                                        "current_page", result.getNumber() + 1,
                                        "total_pages", result.getTotalPages(),
                                        "total_count", result.getTotalElements())));
    }

    @PostMapping("/audit-log-exports")
    public ResponseEntity<Map<String, String>> exportAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    OffsetDateTime to) {
        auditLogService.exportAuditLogs(action, resource, from, to);
        return ResponseEntity.accepted().body(Map.of("message", "Export job queued."));
    }
}

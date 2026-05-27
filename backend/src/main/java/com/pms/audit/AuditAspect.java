package com.pms.audit;

import com.pms.entity.AuditLog;
import com.pms.repository.AuditLogRepository;
import com.pms.security.SecurityUtils;
import java.lang.reflect.Method;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint pjp, Auditable auditable) throws Throwable {
        Object result = pjp.proceed();

        try {
            UUID actorId = resolveActorId();
            UUID resourceId = resolveResourceId(pjp, auditable, result);

            auditLogRepository.save(
                    AuditLog.builder()
                            .id(UUID.randomUUID())
                            .createdAt(OffsetDateTime.now())
                            .actorId(actorId)
                            .action(auditable.action())
                            .resource(auditable.resource())
                            .resourceId(resourceId)
                            .build());
        } catch (Exception e) {
            log.warn(
                    "Failed to write audit log for action={}: {}",
                    auditable.action(),
                    e.getMessage());
        }

        return result;
    }

    private UUID resolveActorId() {
        try {
            return SecurityUtils.currentUserId();
        } catch (Exception e) {
            return null;
        }
    }

    private UUID resolveResourceId(ProceedingJoinPoint pjp, Auditable auditable, Object result) {
        String spec = auditable.resourceIdFrom();
        if (spec.equals("return") || spec.startsWith("return.")) {
            return extractIdFromResult(result, spec);
        }
        return extractIdFromParameter(pjp, spec);
    }

    private UUID extractIdFromResult(Object result, String spec) {
        if (result == null) return null;
        // "return" → getId() on the result
        // "return.field1.field2" → chain of getters (getField1, then getField2)
        String[] parts = spec.equals("return") ? new String[]{"id"} : spec.substring("return.".length()).split("\\.");
        Object current = result;
        try {
            for (String part : parts) {
                if (current == null) return null;
                String getter = "get" + Character.toUpperCase(part.charAt(0)) + part.substring(1);
                Method m = current.getClass().getMethod(getter);
                current = m.invoke(current);
            }
        } catch (Exception e) {
            return null;
        }
        return toUuid(current);
    }

    private UUID extractIdFromParameter(ProceedingJoinPoint pjp, String paramName) {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        String[] names = sig.getParameterNames();
        Object[] args = pjp.getArgs();
        if (names == null) return null;
        for (int i = 0; i < names.length; i++) {
            if (paramName.equals(names[i])) {
                return toUuid(args[i]);
            }
        }
        return null;
    }

    private UUID toUuid(Object value) {
        if (value instanceof UUID u) return u;
        if (value instanceof String s) {
            try { return UUID.fromString(s); } catch (IllegalArgumentException e) { return null; }
        }
        return null;
    }
}

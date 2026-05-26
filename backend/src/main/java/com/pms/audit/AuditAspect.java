package com.pms.audit;

import com.pms.entity.AuditLog;
import com.pms.repository.AuditLogRepository;
import com.pms.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.OffsetDateTime;
import java.util.UUID;

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

            auditLogRepository.save(AuditLog.builder()
                    .id(UUID.randomUUID())
                    .createdAt(OffsetDateTime.now())
                    .actorId(actorId)
                    .action(auditable.action())
                    .resource(auditable.resource())
                    .resourceId(resourceId)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to write audit log for action={}: {}", auditable.action(), e.getMessage());
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
        if ("return".equals(auditable.resourceIdFrom())) {
            return extractIdFromResult(result);
        }
        return extractIdFromParameter(pjp, auditable.resourceIdFrom());
    }

    private UUID extractIdFromResult(Object result) {
        if (result == null) return null;
        try {
            Method getId = result.getClass().getMethod("getId");
            Object id = getId.invoke(result);
            return id instanceof UUID u ? u : null;
        } catch (Exception e) {
            return null;
        }
    }

    private UUID extractIdFromParameter(ProceedingJoinPoint pjp, String paramName) {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        String[] names = sig.getParameterNames();
        Object[] args = pjp.getArgs();
        if (names == null) return null;
        for (int i = 0; i < names.length; i++) {
            if (paramName.equals(names[i]) && args[i] instanceof UUID u) {
                return u;
            }
        }
        return null;
    }
}

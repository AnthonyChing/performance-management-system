package com.pms.audit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.pms.entity.AuditLog;
import com.pms.repository.AuditLogRepository;
import java.util.UUID;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class AuditAspectTest {

    @Mock private AuditLogRepository auditLogRepository;
    @Mock private ProceedingJoinPoint pjp;
    @Mock private MethodSignature methodSignature;
    @Mock private Auditable auditable;

    private AuditAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new AuditAspect(auditLogRepository);
        SecurityContextHolder.clearContext();
        when(auditable.action()).thenReturn("TEST_ACTION");
        when(auditable.resource()).thenReturn("test_resource");
        when(auditable.resourceIdFrom()).thenReturn("");
    }

    @Test
    void audit_savesAuditLog() throws Throwable {
        UUID returnedId = UUID.randomUUID();
        when(pjp.proceed()).thenReturn(returnedId);
        when(pjp.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getParameterNames()).thenReturn(new String[] {});
        when(pjp.getArgs()).thenReturn(new Object[] {});
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        Object result = aspect.audit(pjp, auditable);

        assertEquals(returnedId, result);
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void audit_whenSaveFails_stillReturnsResult() throws Throwable {
        when(pjp.proceed()).thenReturn("someResult");
        when(pjp.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getParameterNames()).thenReturn(new String[] {});
        when(pjp.getArgs()).thenReturn(new Object[] {});
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB error"));

        Object result = aspect.audit(pjp, auditable);

        assertEquals("someResult", result);
    }

    @Test
    void audit_withReturnResourceId_extractsIdFromResult() throws Throwable {
        UUID id = UUID.randomUUID();
        TestDTO dto = new TestDTO(id);
        when(pjp.proceed()).thenReturn(dto);
        when(auditable.resourceIdFrom()).thenReturn("return");
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> id.equals(log.getResourceId())));
    }

    @Test
    void audit_withReturnFieldPath_extractsNestedId() throws Throwable {
        UUID id = UUID.randomUUID();
        TestDTO dto = new TestDTO(id);
        when(pjp.proceed()).thenReturn(dto);
        when(auditable.resourceIdFrom()).thenReturn("return.id");
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> id.equals(log.getResourceId())));
    }

    @Test
    void audit_withNullResult_savesNullResourceId() throws Throwable {
        when(pjp.proceed()).thenReturn(null);
        when(auditable.resourceIdFrom()).thenReturn("return");
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> log.getResourceId() == null));
    }

    @Test
    void audit_withStringUuidParam_convertsToUuid() throws Throwable {
        UUID id = UUID.randomUUID();
        when(pjp.proceed()).thenReturn(null);
        when(auditable.resourceIdFrom()).thenReturn("resourceId");
        when(pjp.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getParameterNames()).thenReturn(new String[] {"resourceId"});
        when(pjp.getArgs()).thenReturn(new Object[] {id.toString()});
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> id.equals(log.getResourceId())));
    }

    @Test
    void audit_withInvalidStringParam_savesNullResourceId() throws Throwable {
        when(pjp.proceed()).thenReturn(null);
        when(auditable.resourceIdFrom()).thenReturn("resourceId");
        when(pjp.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getParameterNames()).thenReturn(new String[] {"resourceId"});
        when(pjp.getArgs()).thenReturn(new Object[] {"not-a-uuid"});
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> log.getResourceId() == null));
    }

    @Test
    void audit_withParamNotFound_savesNullResourceId() throws Throwable {
        when(pjp.proceed()).thenReturn(null);
        when(auditable.resourceIdFrom()).thenReturn("nonExistentParam");
        when(pjp.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getParameterNames()).thenReturn(new String[] {"otherId"});
        when(pjp.getArgs()).thenReturn(new Object[] {UUID.randomUUID()});
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> log.getResourceId() == null));
    }

    @Test
    void audit_withNoSecurityContext_savesNullActorId() throws Throwable {
        when(pjp.proceed()).thenReturn(null);
        when(pjp.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getParameterNames()).thenReturn(new String[] {});
        when(pjp.getArgs()).thenReturn(new Object[] {});
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        aspect.audit(pjp, auditable);

        verify(auditLogRepository).save(argThat(log -> log.getActorId() == null));
    }

    static class TestDTO {
        private final UUID id;

        TestDTO(UUID id) {
            this.id = id;
        }

        public UUID getId() {
            return id;
        }
    }
}

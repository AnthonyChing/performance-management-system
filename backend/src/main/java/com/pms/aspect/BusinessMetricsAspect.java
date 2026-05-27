package com.pms.aspect;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class BusinessMetricsAspect {

    private final MeterRegistry meterRegistry;

    public BusinessMetricsAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    // 1. KPI Pointcuts
    @Pointcut("execution(* com.pms.service.employee.EmployeeKpiService.evaluateKpi*(..))")
    public void evaluateKpi() {}

    // 2. Goal Pointcuts
    @Pointcut("execution(* com.pms.service.employee.EmployeeGoalService.createGoal(..))")
    public void createGoal() {}

    // 3. Appeal Pointcuts
    @Pointcut("execution(* com.pms.service.employee.EmployeeAppealService.submitAppeal(..))")
    public void submitAppeal() {}

    @Around("evaluateKpi()")
    public Object recordKpiEvaluationMetrics(ProceedingJoinPoint pjp) throws Throwable {
        return recordTimerAndCounter(pjp, "pms.business.kpi.evaluate");
    }

    @Around("createGoal()")
    public Object recordGoalCreationMetrics(ProceedingJoinPoint pjp) throws Throwable {
        return recordTimerAndCounter(pjp, "pms.business.goal.create");
    }

    @Around("submitAppeal()")
    public Object recordAppealSubmissionMetrics(ProceedingJoinPoint pjp) throws Throwable {
        return recordTimerAndCounter(pjp, "pms.business.appeal.submit");
    }

    private Object recordTimerAndCounter(ProceedingJoinPoint pjp, String metricPrefix) throws Throwable {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            Object result = pjp.proceed();
            meterRegistry.counter(metricPrefix + ".count", "status", "success").increment();
            return result;
        } catch (Throwable e) {
            meterRegistry.counter(metricPrefix + ".count", "status", "error").increment();
            throw e;
        } finally {
            sample.stop(Timer.builder(metricPrefix + ".time")
                    .description("Execution time for " + metricPrefix)
                    .register(meterRegistry));
        }
    }
}

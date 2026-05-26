package com.pms.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();
    String resource();
    /**
     * How to extract the resourceId:
     * - "return" → call getId() on the return value
     * - any other string → name of the UUID parameter (e.g. "templateId")
     */
    String resourceIdFrom() default "return";
}

package com.pms.exception;

import org.springframework.http.HttpStatus;

/**
 * Base for all API errors. Carries the HTTP status plus the stable machine {@code code} that the
 * employee API contract exposes (e.g. {@code USER_NOT_FOUND}, {@code INVALID_GOAL_STATUS}).
 * Rendered by {@link GlobalExceptionHandler} into the {@code
 * {"error":{"code","message","details"}}} envelope.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }
}

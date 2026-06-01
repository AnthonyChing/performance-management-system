package com.pms.exception;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class ConflictExceptionTest {

    @Test
    void constructor_withMessage_setsConflictStatus() {
        ConflictException ex = new ConflictException("something conflicted");
        assertEquals(HttpStatus.CONFLICT, ex.status());
        assertEquals("CONFLICT", ex.code());
        assertEquals("something conflicted", ex.getMessage());
    }

    @Test
    void constructor_withCodeAndMessage_setsFields() {
        ConflictException ex = new ConflictException("STATE_CONFLICT", "cycle is locked");
        assertEquals(HttpStatus.CONFLICT, ex.status());
        assertEquals("STATE_CONFLICT", ex.code());
        assertEquals("cycle is locked", ex.getMessage());
    }
}

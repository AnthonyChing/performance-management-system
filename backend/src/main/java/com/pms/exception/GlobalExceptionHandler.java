package com.pms.exception;

import com.pms.service.DiscordAlertService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final DiscordAlertService discordAlertService;

    public GlobalExceptionHandler(DiscordAlertService discordAlertService) {
        this.discordAlertService = discordAlertService;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        // Send alert to Discord
        discordAlertService.sendCrashAlert(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getName());
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "Internal Server Error");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

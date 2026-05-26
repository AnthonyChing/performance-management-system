package com.pms.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Health Check Controller Provides endpoint for monitoring server health and status */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @Value("${spring.application.version}")
    private String appVersion;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "Performance Management System");
        response.put("version", appVersion);
        response.put("instance", instanceId());
        return ResponseEntity.ok(response);
    }

    private String instanceId() {
        return System.getenv().getOrDefault("HOSTNAME", "local-dev");
    }
}

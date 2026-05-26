package com.pms.controller.hr;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrNotificationController {

    @PostMapping
    public ResponseEntity<Map<String, String>> sendNotification(@RequestBody Map<String, Object> req) {
        // Notification dispatch is handled externally; stub returns success
        return ResponseEntity.accepted().body(Map.of("message", "Notification job queued."));
    }
}

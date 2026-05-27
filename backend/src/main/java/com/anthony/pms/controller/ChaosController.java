package com.anthony.pms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chaos Engineering Controller for testing Observability and Alerting.
 * This simulates real-world failures without changing existing business logic.
 */
@RestController
@RequestMapping("/api/chaos")
public class ChaosController {

    /**
     * Simulates a critical backend failure (HTTP 500)
     * Used for testing Error Rate > 1% alerts.
     */
    @GetMapping("/error")
    public String triggerError() {
        throw new RuntimeException("Chaos Engineering: Simulated Backend Crash!");
    }

    /**
     * Simulates a slow database query or API bottleneck (HTTP 200, but high latency)
     * Used for testing P95 Latency > 1000ms alerts.
     */
    @GetMapping("/latency")
    public String triggerLatency() throws InterruptedException {
        // Sleep for 2000ms (2 seconds)
        Thread.sleep(2000);
        return "Chaos Engineering: Simulated 2000ms Latency!";
    }
}

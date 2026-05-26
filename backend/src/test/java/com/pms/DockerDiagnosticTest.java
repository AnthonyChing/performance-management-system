package com.pms;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Minimal diagnostic test - no Spring context, just raw Testcontainers. If this fails, the issue is
 * Docker access, not Spring config.
 */
class DockerDiagnosticTest {

    @Test
    void dockerIsAvailable() {
        System.out.println("=== DOCKER DIAGNOSTIC ===");
        System.out.println("DOCKER_HOST env: " + System.getenv("DOCKER_HOST"));
        System.out.println("docker.host prop: " + System.getProperty("testcontainers.docker.host"));

        boolean available;
        try {
            available = DockerClientFactory.instance().isDockerAvailable();
            System.out.println("Docker available: " + available);
        } catch (Exception e) {
            System.out.println("Exception checking Docker: " + e.getMessage());
            available = false;
        }

        assertTrue(available, "Docker must be available for Testcontainers to work");
    }

    @Test
    void postgresContainerCanStart() {
        try (PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:15-alpine")) {
            pg.start();
            System.out.println("PostgreSQL started at: " + pg.getJdbcUrl());
            assertTrue(pg.isRunning());
        }
    }
}

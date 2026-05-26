package com.pms.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared Testcontainers configuration for integration tests.
 *
 * <p>Starts a PostgreSQL 15 container once per test suite and uses {@code @ServiceConnection} to
 * automatically override the Spring datasource properties — no manual JDBC URL wiring needed.
 *
 * <p>Usage: annotate any integration test class with {@code @Import(TestcontainersConfig.class)}.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        // Match the production image (docker-compose.yml uses postgres:17-alpine)
        // so migration SQL is verified against the exact engine that runs in prod.
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:17-alpine"))
                .withDatabaseName("pms_test")
                .withUsername("pms_user")
                .withPassword("pms_pass")
                .withReuse(true); // reuse the container across test classes for speed
    }
}

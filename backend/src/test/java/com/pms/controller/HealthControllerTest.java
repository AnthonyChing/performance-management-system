package com.pms.controller;

import com.pms.config.TestcontainersConfig;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for {@link HealthController}.
 *
 * <p>Demonstrates TDD pattern with REST Assured:
 * <ol>
 *   <li>Write the test first (Red)</li>
 *   <li>Implement the endpoint (Green)</li>
 *   <li>Refactor</li>
 * </ol>
 *
 * <p>A real PostgreSQL container is started via {@link TestcontainersConfig}.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class HealthControllerTest {

    @LocalServerPort
    private int port;

    /** Injected from application.properties → filled by Maven resource filtering from pom.xml */
    @Value("${spring.application.version}")
    private String expectedVersion;

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        RestAssured.requestSpecification = new RequestSpecBuilder()
                .setPort(port)
                .setBasePath("/api/v1")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/health → 200 OK with correct body structure")
    void health_returnsOkWithExpectedFields() {
        given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .body("status", equalTo("UP"))
                .body("service", equalTo("Performance Management System"))
                .body("version", equalTo(expectedVersion))   // 自動對齊 pom.xml 版本
                .body("timestamp", notNullValue())
                .body("instance", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v1/health → version 格式符合 SemVer (x.y.z)")
    void health_versionFollowsSemVer() {
        given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .body("version", matchesPattern("\\d+\\.\\d+\\.\\d+.*"));  // e.g. 1.0.0 or 1.2.3-SNAPSHOT
    }

    @Test
    @DisplayName("GET /api/v1/health → Content-Type is application/json")
    void health_returnsJsonContentType() {
        given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .contentType("application/json");
    }

    @Test
    @DisplayName("GET /api/v1/health → Response time is under 500ms")
    void health_respondsWithinAcceptableTime() {
        given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .time(lessThan(500L));
    }
}

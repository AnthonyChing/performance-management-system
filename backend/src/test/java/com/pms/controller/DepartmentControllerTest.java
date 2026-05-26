package com.pms.controller;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

/**
 * Integration tests for the read-only /api/v1/departments endpoints. Departments
 * are provisioned externally, so test data is seeded directly via JDBC rather
 * than through a write endpoint.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class DepartmentControllerTest {

    private static final String USER_ID = "00000000-0000-0000-0000-0000000000c1";

    @LocalServerPort
    int port;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/api/v1";

        String token = jwtUtil.generateToken(UUID.fromString(USER_ID), List.of("employee"));
        RestAssured.requestSpecification = new RequestSpecBuilder()
                .addHeader("Authorization", "Bearer " + token)
                .build();

        // CASCADE handles all FK dependencies (performance_cycles, users, etc.)
        jdbc.execute("TRUNCATE TABLE departments CASCADE");
    }

    @AfterEach
    void tearDown() throws IOException {
        // Restore test seed so other test classes find the expected data
        String sql = new String(
                new ClassPathResource("db/test-seed/R__test_seed.sql").getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);
        jdbc.execute(sql);
    }

    @Test
    @DisplayName("GET /departments returns active departments by default; includeClosed=true returns all")
    void list_filtersClosed() {
        UUID active = seedDepartment("Active", null, false);
        seedDepartment("Closed", null, true);

        given().when().get("/departments?includeClosed=false")
                .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].id", equalTo(active.toString()));

        given().when().get("/departments?includeClosed=true")
                .then()
                .statusCode(200)
                .body("size()", equalTo(2));
    }

    @Test
    @DisplayName("GET /departments/{id} returns the department")
    void get_byId() {
        UUID id = seedDepartment("Engineering", null, false);

        given().when().get("/departments/" + id)
                .then()
                .statusCode(200)
                .body("id", equalTo(id.toString()))
                .body("name", equalTo("Engineering"));
    }

    @Test
    @DisplayName("GET /departments/{id} on unknown id → 404")
    void get_unknown_404() {
        given().when().get("/departments/" + UUID.randomUUID())
                .then().statusCode(404);
    }

    private UUID seedDepartment(String name, UUID parentId, boolean closed) {
        UUID id = UUID.randomUUID();
        jdbc.update(
                "INSERT INTO departments (id, name, parent_id, closed_at) " +
                        "VALUES (?::uuid, ?, ?::uuid, CASE WHEN ? THEN now() ELSE NULL END)",
                id.toString(), name,
                parentId == null ? null : parentId.toString(),
                closed);
        return id;
    }
}

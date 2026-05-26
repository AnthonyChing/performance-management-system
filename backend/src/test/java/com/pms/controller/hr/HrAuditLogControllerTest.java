package com.pms.controller.hr;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class HrAuditLogControllerTest {

    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";
    private static final String AUDIT_LOG_ID = "00000000-0000-0000-0000-0000000a0001";

    @LocalServerPort int port;

    @Autowired JwtUtil jwtUtil;

    @Autowired JdbcTemplate jdbc;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();

        jdbc.update("DELETE FROM audit_logs WHERE id = ?::uuid", AUDIT_LOG_ID);
        jdbc.update(
                """
                INSERT INTO audit_logs
                    (id, actor_id, action, resource, resource_id, old_value, new_value, ip_address, created_at)
                VALUES
                    (?::uuid, ?::uuid, 'cycle.create', 'performance_cycle',
                     '00000000-0000-0000-0000-000000010001'::uuid,
                     '{}'::jsonb, '{"status":"draft"}'::jsonb, '127.0.0.1',
                     '2026-01-02T03:04:05+00:00'::timestamptz)
                """,
                AUDIT_LOG_ID,
                HR_ID);

        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        requestSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/hr")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    private RequestSpecification given() {
        return RestAssured.given().spec(requestSpec);
    }

    @Test
    void listAuditLogs_returnsPagedAuditLogs() {
        given().when()
                .get("/audit-logs")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data.id", hasItem(AUDIT_LOG_ID))
                .body("data.action", hasItem("cycle.create"))
                .body("meta.current_page", equalTo(1))
                .body("meta.total_count", notNullValue());
    }

    @Test
    void listAuditLogs_withFilters_returnsMatchingAuditLog() {
        given().queryParam("action", "cycle.create")
                .queryParam("resource", "performance_cycle")
                .queryParam("actor_id", HR_ID)
                .queryParam("from", "2026-01-02T00:00:00Z")
                .queryParam("to", "2026-01-03T00:00:00Z")
                .when()
                .get("/audit-logs")
                .then()
                .statusCode(200)
                .body("data.id", hasItem(AUDIT_LOG_ID))
                .body("data.actor_id", hasItem(HR_ID));
    }

    @Test
    void exportAuditLogs_returnsAcceptedMessage() {
        given().queryParam("action", "cycle.create")
                .when()
                .post("/audit-log-exports")
                .then()
                .statusCode(202)
                .body("message", equalTo("Export job queued."));
    }

    @Test
    void listAuditLogs_withEmployeeRole_returns403() {
        String employeeToken =
                jwtUtil.generateToken(
                        UUID.fromString("00000000-0000-0000-0000-0000000000c1"),
                        List.of("employee"));
        RequestSpecification employeeSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/hr")
                        .addHeader("Authorization", "Bearer " + employeeToken)
                        .build();

        RestAssured.given()
                .spec(employeeSpec)
                .when()
                .get("/audit-logs")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }
}

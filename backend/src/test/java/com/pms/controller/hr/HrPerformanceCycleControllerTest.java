package com.pms.controller.hr;

import static org.hamcrest.Matchers.equalTo;
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
class HrPerformanceCycleControllerTest {

    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";
    private static final String CYCLE_ID = "123e4567-e89b-12d3-a456-4266141740c1";

    @LocalServerPort int port;

    @Autowired JwtUtil jwtUtil;

    @Autowired JdbcTemplate jdbc;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();

        jdbc.update("DELETE FROM cycle_template_assignments WHERE cycle_id = ?::uuid", CYCLE_ID);
        jdbc.update("DELETE FROM performance_cycles WHERE id = ?::uuid", CYCLE_ID);
        jdbc.update(
                """
                INSERT INTO performance_cycles (
                  id, name, cycle_type, status, timezone,
                  self_eval_start, self_eval_end,
                  manager_eval_start, manager_eval_end,
                  hr_review_end, appeal_deadline_days, is_locked, created_by
                ) VALUES (
                  ?::uuid, 'HR Test Cycle', 'quarterly', 'not_started', 'Asia/Taipei',
                  '2026-01-01T00:00:00+08:00', '2026-01-31T23:59:59+08:00',
                  '2026-02-01T00:00:00+08:00', '2026-02-28T23:59:59+08:00',
                  '2026-03-15T23:59:59+08:00', 7, false, ?::uuid
                )
                """,
                CYCLE_ID,
                HR_ID);

        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        requestSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/hr/performance-cycles")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    private RequestSpecification given() {
        return RestAssured.given().spec(requestSpec);
    }

    @Test
    void createCycle_returnsCreatedCycle() {
        String body =
                """
                {
                  "name": "2026 總部員工績效考核",
                  "cycle_type": "quarterly",
                  "timezone": "Asia/Taipei",
                  "self_eval_start": "2026-07-01T00:00:00+08:00",
                  "self_eval_end": "2026-07-31T23:59:59+08:00",
                  "manager_eval_start": "2026-08-01T00:00:00+08:00",
                  "manager_eval_end": "2026-08-31T23:59:59+08:00",
                  "hr_review_end": "2026-09-15T23:59:59+08:00",
                  "appeal_deadline_days": 7
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("name", equalTo("2026 總部員工績效考核"))
                .body("cycle_type", equalTo("quarterly"))
                .body("status", equalTo("not_started"));
    }

    @Test
    void createCycle_withMissingName_returns400() {
        String body =
                """
                {
                  "cycle_type": "quarterly",
                  "manager_eval_start": "2026-08-01T00:00:00+08:00",
                  "manager_eval_end": "2026-08-31T23:59:59+08:00",
                  "hr_review_end": "2026-09-15T23:59:59+08:00"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void listCycles_returnsPagedResult() {
        given().when()
                .get()
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue())
                .body("meta", notNullValue());
    }

    @Test
    void listCycles_withStatusFilter_returnsFiltered() {
        given().queryParam("status", "not_started")
                .when()
                .get()
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getCycle_returnsCycleDetail() {
        given().when()
                .get("/" + CYCLE_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("id", equalTo(CYCLE_ID))
                .body("status", equalTo("not_started"));
    }

    @Test
    void getCycle_withNonExistentId_returns404() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void updateCycle_returnsUpdatedCycle() {
        String body =
                """
                {
                  "name": "2026 總部員工績效考核 (修訂版)",
                  "manager_eval_end": "2026-10-15T23:59:59+08:00"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + CYCLE_ID)
                .then()
                .statusCode(200)
                .body("name", equalTo("2026 總部員工績效考核 (修訂版)"));
    }

    @Test
    void changeCycleStatus_toInProgress_returnsUpdatedCycle() {
        String body =
                """
                {
                  "status": "in_progress"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + CYCLE_ID + "/status")
                .then()
                .statusCode(200)
                .body("status", equalTo("in_progress"));
    }

    @Test
    void changeCycleStatus_toClosed_returnsUpdatedCycle() {
        String body =
                """
                {
                  "status": "closed"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + CYCLE_ID + "/status")
                .then()
                .statusCode(200)
                .body("status", equalTo("closed"));
    }

    @Test
    void changeCycleStatus_withInvalidStatus_returns400() {
        String body =
                """
                {
                  "status": "invalid_status"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + CYCLE_ID + "/status")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }
}

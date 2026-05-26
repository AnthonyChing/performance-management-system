package com.pms.controller.employee;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EmployeeKpiControllerTest {

    // Review IDs from test seed
    private static final String REVIEW_ID           = "00000000-0000-0000-0000-000000020001"; // active, no confirmation
    private static final String REVIEW_ID_CONFIRMED = "00000000-0000-0000-0000-000000020002"; // already confirmed
    private static final String CYCLE_ID            = "00000000-0000-0000-0000-000000010001";
    private static final String CYCLE_ID_COMPLETED  = "00000000-0000-0000-0000-000000010002";
    private static final String USER_ID             = "00000000-0000-0000-0000-0000000000c1";

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    JwtUtil jwtUtil;

    @LocalServerPort
    int port;

    private String token;

    @BeforeAll
    void resetKpiState() {
        // Remove any confirmation or appeal for REVIEW_ID created by previous test runs
        jdbc.execute("DELETE FROM kpi_result_confirmations WHERE review_id = '" + REVIEW_ID + "'");
        jdbc.execute("DELETE FROM appeals WHERE review_id = '" + REVIEW_ID + "'");
        token = jwtUtil.generateToken(UUID.fromString(USER_ID), List.of("employee"));
    }

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/api/v1/me";
        RestAssured.requestSpecification = new RequestSpecBuilder()
                .addHeader("Authorization", "Bearer " + token)
                .build();
    }

    @Test
    @Order(1)
    void getKpiStandards_returnsStandards() {
        given()
                .when()
                .get("/kpis/standards")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("cycle.cycle_id", equalTo(CYCLE_ID))
                .body("employee.user_id", equalTo(USER_ID))
                .body("standards.size()", equalTo(2))
                .body("standards.kpi_id", hasItems(
                        "00000000-0000-0000-0000-000000060001",
                        "00000000-0000-0000-0000-000000060002"));
    }

    @Test
    @Order(2)
    void getKpiResult_returnsCurrentResult() {
        given()
                .when()
                .get("/kpis/result")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("result.result_id", equalTo(REVIEW_ID))
                .body("result.status", equalTo("pending_confirmation"))
                .body("result.available_actions.can_confirm", equalTo(true));
    }

    @Test
    @Order(3)
    void getHistoricalKpiResults_returnsList() {
        given()
                .when()
                .get("/kpis/result?status=historical")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_results"))
                .body("pagination.page", equalTo(1))
                .body("results.size()", equalTo(1))
                .body("results[0].result_id", equalTo(REVIEW_ID_CONFIRMED));
    }

    @Test
    @Order(4)
    void getHistoricalKpiResults_withCycle_returnsDetail() {
        given()
                .when()
                .get("/kpis/result?status=historical&cycleId=" + CYCLE_ID_COMPLETED)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_result_detail"))
                .body("result.result_id", equalTo(REVIEW_ID_CONFIRMED))
                .body("result.cycle.cycle_id", equalTo(CYCLE_ID_COMPLETED));
    }

    @Test
    @Order(5)
    void confirmKpiResult_withConfirmedFalse_returns400() {
        String requestBody = """
                {
                  "result_id": "%s",
                  "confirmed": false
                }
                """.formatted(REVIEW_ID);

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/kpis/result-confirmations")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(6)
    void confirmKpiResult_withMissingResultId_returns400() {
        String requestBody = """
                {
                  "confirmed": true
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/kpis/result-confirmations")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(7)
    void confirmKpiResult_whenResultNotFound_returns404() {
        String requestBody = """
                {
                  "result_id": "00000000-0000-0000-0000-999999999999",
                  "confirmed": true
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/kpis/result-confirmations")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("KPI_RESULT_NOT_FOUND"));
    }

    @Test
    @Order(8)
    void confirmKpiResult_whenAlreadyConfirmed_returns409() {
        String requestBody = """
                {
                  "result_id": "%s",
                  "confirmed": true
                }
                """.formatted(REVIEW_ID_CONFIRMED);

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/kpis/result-confirmations")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("KPI_RESULT_ALREADY_CONFIRMED"));
    }

    @Test
    @Order(9)
    void confirmKpiResult_returnsConfirmation() {
        String requestBody = """
                {
                  "result_id": "%s",
                  "confirmed": true
                }
                """.formatted(REVIEW_ID);

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/kpis/result-confirmations")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("confirmation.result_id", equalTo(REVIEW_ID))
                .body("result.status", equalTo("confirmed"))
                .body("result.available_actions.can_confirm", equalTo(false))
                .body("result.available_actions.confirm_unavailable_reason", equalTo("already_confirmed"));
    }
}

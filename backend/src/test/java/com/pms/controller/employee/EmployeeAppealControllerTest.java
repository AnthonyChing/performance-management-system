package com.pms.controller.employee;

import com.pms.config.TestcontainersConfig;
import io.restassured.RestAssured;
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

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EmployeeAppealControllerTest {

    // Cycle 1 (in_progress, appeal period open) — Eric's review has no pre-existing appeal
    private static final String CYCLE_ID_ACTIVE = "00000000-0000-0000-0000-000000010001";
    // Cycle 3 (results_published, appeal period open) — Eric's review already has an appeal
    private static final String CYCLE_ID_ALREADY_APPEALED = "00000000-0000-0000-0000-000000010003";
    // Review ID for Cycle 1 (the one that gets appealed in Order 5)
    private static final String REVIEW_ID_CYCLE1 = "00000000-0000-0000-0000-000000020001";

    @Autowired
    JdbcTemplate jdbc;

    @LocalServerPort
    int port;

    @BeforeAll
    void resetAppeals() {
        // Remove any appeal for Cycle 1's review created by previous test runs
        jdbc.execute("DELETE FROM appeals WHERE review_id = '" + REVIEW_ID_CYCLE1 + "'");
    }

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/api/v1/me";
    }

    @Test
    @Order(1)
    void getAppeals_returnsComposeState() {
        given()
                .when()
                .get("/appeals")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("compose"))
                .body("appeal_period.status", equalTo("open"))
                .body("available_actions.can_start_appeal", equalTo(true))
                .body("available_actions.can_submit", equalTo(true));
    }

    @Test
    @Order(2)
    void submitAppeal_withMissingReason_returns400() {
        String requestBody = """
                {
                  "period_id": "%s"
                }
                """.formatted(CYCLE_ID_ACTIVE);

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/appeals/submit")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(3)
    void submitAppeal_withMissingPeriodId_returns400() {
        String requestBody = """
                {
                  "reason": "Missing period_id field"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/appeals/submit")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(4)
    void submitAppeal_whenAlreadySubmitted_returns409() {
        String requestBody = """
                {
                  "period_id": "%s",
                  "reason": "Duplicate appeal submission"
                }
                """.formatted(CYCLE_ID_ALREADY_APPEALED);

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/appeals/submit")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("APPEAL_ALREADY_SUBMITTED"));
    }

    @Test
    @Order(5)
    void submitAppeal_returnsSubmittedAppeal() {
        String requestBody = """
                {
                  "period_id": "%s",
                  "reason": "Need clarification on rating"
                }
                """.formatted(CYCLE_ID_ACTIVE);

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/appeals/submit")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("appeal.status", equalTo("submitted"))
                .body("appeal.reason", equalTo("Need clarification on rating"))
                .body("available_actions.can_submit", equalTo(false))
                .body("available_actions.submit_unavailable_reason", equalTo("already_submitted"));
    }

    @Test
    @Order(6)
    void getAppealResult_returnsSubmittedAppeal() {
        given()
                .when()
                .get("/appeals/result")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("appeal.status", equalTo("submitted"))
                .body("appeal.reason", equalTo("Need clarification on rating"));
    }
}

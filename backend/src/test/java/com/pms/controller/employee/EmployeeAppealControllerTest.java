package com.pms.controller.employee;

import com.pms.config.TestcontainersConfig;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class EmployeeAppealControllerTest {

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/me";
    }

    @Test
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
    void submitAppeal_returnsSubmittedAppeal() {
        String requestBody = """
                {
                  "period_id": "cycle_2025_q3",
                  "reason": "Need clarification on rating"
                }
                """;

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
    void getAppealResult_returnsResolvedResult() {
        given()
                .when()
                .get("/appeals/result")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("appeal.status", equalTo("approved"))
                .body("appeal.is_final_response", equalTo(true))
                .body("review_result.final_rating", equalTo("meets_expectations"));
    }
}

package com.pms.controller.manager;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import java.util.List;
import java.util.UUID;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ManagerEvaluationControllerTest {

    private static final String MANAGER_ID = "123e4567-e89b-12d3-a456-426614174020";
    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174010";
    private static final String EVALUATION_ID = "123e4567-e89b-12d3-a456-426614174060";
    private static final String EVALUATION_ID_WRONG_STAGE = "123e4567-e89b-12d3-a456-426614174061";
    private static final String NON_SUBORDINATE_USER_ID = "00000000-0000-0000-0000-000000000099";

    @Autowired JwtUtil jwtUtil;
    @Autowired JdbcTemplate jdbc;

    @LocalServerPort int port;

    private String token;

    @BeforeAll
    void setUpAll() {
        token = jwtUtil.generateToken(UUID.fromString(MANAGER_ID), List.of("manager"));
        jdbc.execute(
                "UPDATE performance_reviews SET status = 'manager_eval_in_progress', manager_submitted_at = NULL"
                        + " WHERE id = '"
                        + EVALUATION_ID
                        + "'");
        jdbc.execute("DELETE FROM review_responses WHERE review_id = '" + EVALUATION_ID + "'");
    }

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        RestAssured.requestSpecification =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/users")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    @Test
    @Order(1)
    void submitEvaluation_whenNotAuthorized_returns403() {
        String body =
                """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + NON_SUBORDINATE_USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(2)
    void submitEvaluation_whenEvaluationNotFound_returns404() {
        String body =
                """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(3)
    void getEvaluationHistory_returnsHistoricalEvaluations() {
        given().when()
                .get("/" + USER_ID + "/evaluations")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue());
    }

    @Test
    @Order(4)
    void getEvaluationHistory_withCycleIdFilter_returnsFilteredHistory() {
        given().queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when()
                .get("/" + USER_ID + "/evaluations")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    @Order(5)
    void getEvaluationHistory_forNonSubordinate_returns403() {
        given().when()
                .get("/" + NON_SUBORDINATE_USER_ID + "/evaluations")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(6)
    void getEvaluationHistory_forNonExistentUser_returns404() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000000/evaluations")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test
    @Order(7)
    void submitEvaluation_withMissingRequiredResponse_returns400() {
        String body =
                """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations",
                  "responses": []
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(8)
    void submitEvaluation_whenNotInEvalStage_returns409() {
        String body =
                """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID_WRONG_STAGE)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    @Order(9)
    void saveInProgressEvaluation_returnsInProgressStatus() {
        String body =
                """
                {
                  "status": "manager_eval_in_progress",
                  "responses": [
                    {
                      "question_id": "123e4567-e89b-12d3-a456-426614174090",
                      "rating_value": 3
                    }
                  ]
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(200)
                .body("status", equalTo("manager_eval_in_progress"));
    }

    @Test
    @Order(10)
    void submitEvaluation_returnsCompletedEvaluation() {
        String body =
                """
                {
                  "status": "completed",
                  "final_rating": "exceeds_expectations",
                  "manager_comment": "該員工本期表現優異，超乎預期。",
                  "responses": [
                    {
                      "question_id": "123e4567-e89b-12d3-a456-426614174090",
                      "rating_value": 4,
                      "text_value": "業績達標且超出預期"
                    }
                  ]
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("status", equalTo("completed"))
                .body("final_rating", equalTo("exceeds_expectations"))
                .body("manager_comment", equalTo("該員工本期表現優異，超乎預期。"))
                .body("responses", notNullValue());
    }
}

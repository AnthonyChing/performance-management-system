package com.pms.controller.manager;

import com.pms.config.TestcontainersConfig;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class ManagerEvaluationControllerTest {

    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174010";
    private static final String EVALUATION_ID = "123e4567-e89b-12d3-a456-426614174060";

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/users";
    }

    @Test
    void submitEvaluation_returnsCompletedEvaluation() {
        String body = """
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

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("status", equalTo("completed"))
                .body("final_rating", equalTo("exceeds_expectations"))
                .body("manager_comment", equalTo("該員工本期表現優異，超乎預期。"))
                .body("responses", notNullValue());
    }

    @Test
    void saveInProgressEvaluation_returnsInProgressStatus() {
        String body = """
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

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(200)
                .body("status", equalTo("manager_eval_in_progress"));
    }

    @Test
    void submitEvaluation_withMissingRequiredResponse_returns400() {
        String body = """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations",
                  "responses": []
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void submitEvaluation_whenNotAuthorized_returns403() {
        String body = """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/00000000-0000-0000-0000-000000000099/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void submitEvaluation_whenEvaluationNotFound_returns404() {
        String body = """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/evaluations/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void submitEvaluation_whenNotInEvalStage_returns409() {
        String body = """
                {
                  "status": "completed",
                  "final_rating": "meets_expectations"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void getEvaluationHistory_returnsHistoricalEvaluations() {
        given()
                .when().get("/" + USER_ID + "/evaluations")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue());
    }

    @Test
    void getEvaluationHistory_withCycleIdFilter_returnsFilteredHistory() {
        given()
                .queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when().get("/" + USER_ID + "/evaluations")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getEvaluationHistory_forNonSubordinate_returns403() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000099/evaluations")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void getEvaluationHistory_forNonExistentUser_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000/evaluations")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }
}

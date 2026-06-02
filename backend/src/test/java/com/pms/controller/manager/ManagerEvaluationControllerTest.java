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
    private static final String CYCLE_ID = "123e4567-e89b-12d3-a456-426614174001";
    private static final String ASSESSMENT_TEMPLATE_ID = "123e4567-e89b-12d3-a456-426614174080";
    private static final String QUESTION_ID = "123e4567-e89b-12d3-a456-426614174090";
    private static final String EVAL_TEMPLATE_ID = "eeeeeeee-e89b-12d3-a456-426614174001";
    private static final String EVAL_COMPONENT_ID = "cccccccc-e89b-12d3-a456-426614174001";
    private static final String TEMPLATE_VERSION_ID = "bbbbbbbb-e89b-12d3-a456-426614174001";

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
        jdbc.execute(
                "DELETE FROM evaluation_template_components WHERE id = '"
                        + EVAL_COMPONENT_ID
                        + "'");
        jdbc.execute("DELETE FROM evaluation_templates WHERE id = '" + EVAL_TEMPLATE_ID + "'");
        jdbc.execute("DELETE FROM template_versions WHERE id = '" + TEMPLATE_VERSION_ID + "'");
        jdbc.update(
                """
                INSERT INTO template_versions (id, template_id, version, created_at)
                VALUES (?::uuid, ?::uuid, 1, NOW())
                ON CONFLICT (id) DO NOTHING
                """,
                TEMPLATE_VERSION_ID,
                ASSESSMENT_TEMPLATE_ID);
        jdbc.update(
                """
                INSERT INTO evaluation_templates
                    (id, cycle_id, name, status, employee_group_type, employee_group_ref,
                     is_active, created_by, updated_by)
                VALUES (?::uuid, ?::uuid, 'Manager Test Eval Template', 'published',
                        'job_category', 'engineering', true, ?::uuid, ?::uuid)
                """,
                EVAL_TEMPLATE_ID,
                CYCLE_ID,
                MANAGER_ID,
                MANAGER_ID);
        jdbc.update(
                """
                INSERT INTO evaluation_template_components
                    (id, evaluation_template_id, assessment_template_id,
                     assessment_template_version_id, weight_percent, sort_order)
                VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, 100.00, 1)
                """,
                EVAL_COMPONENT_ID,
                EVAL_TEMPLATE_ID,
                ASSESSMENT_TEMPLATE_ID,
                TEMPLATE_VERSION_ID);
        jdbc.update(
                """
                UPDATE performance_reviews
                SET template_version_id = ?::uuid
                WHERE id = ?::uuid
                """,
                TEMPLATE_VERSION_ID,
                EVALUATION_ID_WRONG_STAGE);
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
    void getQuestionnaire_returnsQuestionsAndResponses() {
        given().when()
                .get("/" + USER_ID + "/evaluations/" + EVALUATION_ID + "/questionnaire")
                .then()
                .statusCode(200)
                .body("review_id", equalTo(EVALUATION_ID))
                .body("questions.size()", equalTo(1))
                .body("questions[0].question_id", equalTo(QUESTION_ID))
                .body("questions[0].question_type", equalTo("rating"))
                .body("questions[0].is_required", equalTo(true))
                .body("responses", notNullValue());
    }

    @Test
    @Order(2)
    void getQuestionnaire_usesTemplateVersionAssignedToReview() {
        given().when()
                .get(
                        "/"
                                + USER_ID
                                + "/evaluations/"
                                + EVALUATION_ID_WRONG_STAGE
                                + "/questionnaire")
                .then()
                .statusCode(200)
                .body("review_id", equalTo(EVALUATION_ID_WRONG_STAGE))
                .body("questions.size()", equalTo(1))
                .body("questions[0].question_id", equalTo(QUESTION_ID));
    }

    @Test
    @Order(3)
    void getQuestionnaire_forNonSubordinate_returns403() {
        given().when()
                .get(
                        "/"
                                + NON_SUBORDINATE_USER_ID
                                + "/evaluations/"
                                + EVALUATION_ID
                                + "/questionnaire")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(4)
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
    @Order(5)
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
    @Order(6)
    void getEvaluationHistory_returnsHistoricalEvaluations() {
        given().when()
                .get("/" + USER_ID + "/evaluations")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue());
    }

    @Test
    @Order(7)
    void getEvaluationHistory_withCycleIdFilter_returnsFilteredHistory() {
        given().queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when()
                .get("/" + USER_ID + "/evaluations")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    @Order(8)
    void getEvaluationHistory_forNonSubordinate_returns403() {
        given().when()
                .get("/" + NON_SUBORDINATE_USER_ID + "/evaluations")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(9)
    void getEvaluationHistory_forNonExistentUser_returns404() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000000/evaluations")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test
    @Order(10)
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
    @Order(11)
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
    @Order(12)
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
    @Order(13)
    void updateQuestionnaire_returnsSavedQuestionnaire() {
        String body =
                """
                {
                  "responses": [
                    {
                      "question_id": "123e4567-e89b-12d3-a456-426614174090",
                      "rating_value": 3,
                      "text_value": "表現良好"
                    }
                  ]
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID + "/questionnaire")
                .then()
                .statusCode(200)
                .body("questions.size()", equalTo(1))
                .body("questions[0].question_id", equalTo(QUESTION_ID))
                .body("responses", notNullValue());
    }

    @Test
    @Order(14)
    void updateKpiEvaluation_returnsUpdatedEvaluation() {
        String body =
                """
                {
                  "status": "manager_eval_in_progress",
                  "kpi_evaluations": [
                    {
                      "kpi_id": "123e4567-e89b-12d3-a456-426614174030",
                      "manager_score": 85.0,
                      "manager_feedback": "達成目標"
                    }
                  ]
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/evaluations/" + EVALUATION_ID + "/kpis")
                .then()
                .statusCode(200)
                .body("status", equalTo("manager_eval_in_progress"));
    }

    @Test
    @Order(15)
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

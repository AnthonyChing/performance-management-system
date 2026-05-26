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
class ManagerGoalControllerTest {

    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174010";
    private static final String GOAL_ID = "123e4567-e89b-12d3-a456-426614174000";
    private static final String NON_SUBORDINATE_USER_ID = "00000000-0000-0000-0000-000000000099";

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/users";
    }

    @Test
    void createGoal_returnsCreatedGoalWithPendingReview() {
        String body = """
                {
                  "title": "降低系統延遲時間",
                  "description": "於 Q3 結束前優化資料庫查詢，降低 API 平均回應時間至 200ms 以內。",
                  "goal_type": "individual",
                  "due_date": "2026-09-30"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + USER_ID + "/goals")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("goal_id", notNullValue())
                .body("status", equalTo("pending_review"))
                .body("progress_percent", equalTo(0))
                .body("owner_id", equalTo(USER_ID));
    }

    @Test
    void createGoal_withMissingTitle_returns400() {
        String body = """
                {
                  "description": "Missing title",
                  "due_date": "2026-09-30"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + USER_ID + "/goals")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void createGoal_withDueDateOutsideCycle_returns400() {
        String body = """
                {
                  "title": "目標截止日超出週期",
                  "description": "測試截止日驗證",
                  "due_date": "2099-12-31"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + USER_ID + "/goals")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void createGoal_forNonSubordinate_returns403() {
        String body = """
                {
                  "title": "非直屬部屬",
                  "description": "應回傳 403",
                  "due_date": "2026-09-30"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + NON_SUBORDINATE_USER_ID + "/goals")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void createGoal_forNonExistentUser_returns404() {
        String body = """
                {
                  "title": "查無此員工",
                  "description": "應回傳 404",
                  "due_date": "2026-09-30"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/00000000-0000-0000-0000-000000000000/goals")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test
    void reviewGoal_approvesPendingGoal() {
        String body = """
                {
                  "status": "in_progress"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/goals/" + GOAL_ID)
                .then()
                .statusCode(200)
                .body("status", equalTo("in_progress"))
                .body("goal_id", equalTo(GOAL_ID));
    }

    @Test
    void reviewGoal_requestsRevision() {
        String body = """
                {
                  "status": "revision_requested"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/goals/" + GOAL_ID)
                .then()
                .statusCode(200)
                .body("status", equalTo("revision_requested"));
    }

    @Test
    void reviewGoal_whenGoalNotFound_returns404() {
        String body = """
                {
                  "status": "in_progress"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/goals/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void reviewGoal_whenCycleLocked_returns409() {
        String body = """
                {
                  "status": "in_progress"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/goals/" + GOAL_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void listGoals_returnsSubordinateGoals() {
        given()
                .when().get("/" + USER_ID + "/goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listGoals_withCycleIdFilter_returnsFilteredGoals() {
        given()
                .queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when().get("/" + USER_ID + "/goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listGoals_withStatusFilter_returnsFilteredGoals() {
        given()
                .queryParam("status", "in_progress")
                .when().get("/" + USER_ID + "/goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listGoals_forNonSubordinate_returns403() {
        given()
                .when().get("/" + NON_SUBORDINATE_USER_ID + "/goals")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void listGoals_forNonExistentUser_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000/goals")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }
}

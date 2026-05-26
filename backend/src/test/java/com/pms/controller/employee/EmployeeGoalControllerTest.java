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
class EmployeeGoalControllerTest {

    private static final String CYCLE_ID   = "00000000-0000-0000-0000-000000010001";
    private static final String CYCLE_ID_2 = "00000000-0000-0000-0000-000000010002";
    private static final String GOAL_IN_PROGRESS       = "00000000-0000-0000-0000-000000030002";
    private static final String GOAL_PENDING_REVIEW    = "00000000-0000-0000-0000-000000030001";
    private static final String GOAL_REVISION_REQUESTED = "00000000-0000-0000-0000-000000030003";
    private static final String GOAL_NONEXISTENT       = "00000000-0000-0000-0000-999999999999";
    private static final String USER_ID                = "00000000-0000-0000-0000-0000000000c1";

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    JwtUtil jwtUtil;

    @LocalServerPort
    int port;

    private String token;

    @BeforeAll
    void resetGoals() {
        // Delete goals created by previous test runs (keep only the 4 seed goals)
        jdbc.execute("DELETE FROM goals WHERE id NOT IN (" +
                "'00000000-0000-0000-0000-000000030001'," +
                "'00000000-0000-0000-0000-000000030002'," +
                "'00000000-0000-0000-0000-000000030003'," +
                "'00000000-0000-0000-0000-000000030004')");
        // Restore revision_requested status on goal 3 in case it was updated by a previous run
        jdbc.execute("UPDATE goals SET status = 'revision_requested', title = '優化系統監控指標' " +
                "WHERE id = '00000000-0000-0000-0000-000000030003'");
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
    void getGoals_returnsCurrentCycleGoals() {
        given()
                .when()
                .get("/goals")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("cycle.cycle_id", equalTo(CYCLE_ID))
                .body("summary.total_count", equalTo(3))
                .body("goals.size()", equalTo(3))
                .body("available_actions.can_create_goal", equalTo(true));
    }

    @Test
    @Order(2)
    void getGoals_withHistoricalStatus_returnsCycles() {
        given()
                .when()
                .get("/goals?status=historical")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_cycles"))
                .body("pagination.page", equalTo(1))
                .body("historical_cycles.size()", equalTo(1))
                .body("historical_cycles[0].cycle_id", equalTo(CYCLE_ID_2));
    }

    @Test
    @Order(3)
    void getGoals_withHistoricalCycle_returnsGoals() {
        given()
                .when()
                .get("/goals?status=historical&cycleId=" + CYCLE_ID_2)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_goals"))
                .body("cycle.cycle_id", equalTo(CYCLE_ID_2))
                .body("summary.completed_count", equalTo(1))
                .body("goals[0].goal_id", equalTo("00000000-0000-0000-0000-000000030004"));
    }

    @Test
    @Order(4)
    void getGoalReviewResult_returnsReviewResult() {
        given()
                .when()
                .get("/goals/review-result?goalId=" + GOAL_IN_PROGRESS)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("overall_status", notNullValue())
                .body("results", notNullValue())
                .body("results.goal_id", hasItem(GOAL_IN_PROGRESS));
    }

    @Test
    @Order(5)
    void getGoalReviewResult_withoutGoalId_returnsOverallSummary() {
        given()
                .when()
                .get("/goals/review-result")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("overall_status", notNullValue())
                .body("summary", notNullValue())
                .body("results", notNullValue());
    }

    @Test
    @Order(6)
    void createGoal_withMissingTitle_returns400() {
        String requestBody = """
                {
                  "due_date": "2026-09-30",
                  "description": "Missing title field"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(7)
    void createGoal_withDueDateOutsideCycle_returns409() {
        String requestBody = """
                {
                  "title": "Test Goal",
                  "due_date": "2099-12-31",
                  "description": "Due date outside cycle"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("INVALID_DUE_DATE"));
    }

    @Test
    @Order(8)
    void updateGoal_whenGoalNotFound_returns404() {
        String requestBody = """
                {
                  "title": "Non-existent goal",
                  "due_date": "2026-09-30",
                  "description": "Goal does not exist"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals/" + GOAL_NONEXISTENT)
                .then()
                .statusCode(404)
                .body("error.code", equalTo("GOAL_NOT_FOUND"));
    }

    @Test
    @Order(9)
    void updateGoal_whenGoalNotRevisionRequested_returns409() {
        String requestBody = """
                {
                  "title": "Trying to edit in_progress goal",
                  "due_date": "2026-09-30",
                  "description": "Should fail"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals/" + GOAL_IN_PROGRESS)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("INVALID_GOAL_STATUS"));
    }

    @Test
    @Order(10)
    void updateGoalProgress_whenGoalNotInProgress_returns409() {
        String requestBody = """
                {
                  "progress_percent": 50,
                  "note": "Trying to update pending goal"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals/" + GOAL_PENDING_REVIEW + "/progress-updates")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("INVALID_GOAL_STATUS"));
    }

    @Test
    @Order(11)
    void updateGoalProgress_withInvalidProgressPercent_returns400() {
        String requestBody = """
                {
                  "progress_percent": 150,
                  "note": "Over 100 percent"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals/" + GOAL_IN_PROGRESS + "/progress-updates")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(12)
    void createGoal_returnsCreatedGoal() {
        String requestBody = """
                {
                  "title": "Increase test coverage",
                  "due_date": "2026-09-30",
                  "description": "Reach 80 percent coverage"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("goal.goal_id", notNullValue())
                .body("goal.title", equalTo("Increase test coverage"))
                .body("goal.status", equalTo("pending_review"))
                .body("goal.progress_percent", equalTo(0));
    }

    @Test
    @Order(13)
    void updateGoal_returnsUpdatedGoal() {
        String requestBody = """
                {
                  "title": "Revised goal title",
                  "due_date": "2026-09-15",
                  "description": "Clarified scope"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals/" + GOAL_REVISION_REQUESTED)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("goal.goal_id", equalTo(GOAL_REVISION_REQUESTED))
                .body("goal.title", equalTo("Revised goal title"))
                .body("goal.status", equalTo("pending_review"));
    }

    @Test
    @Order(14)
    void updateGoalProgress_returnsProgressUpdate() {
        String requestBody = """
                {
                  "progress_percent": 45,
                  "note": "Halfway done"
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/goals/" + GOAL_IN_PROGRESS + "/progress-updates")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("progress_update.progress_percent", equalTo(45))
                .body("progress_update.note", equalTo("Halfway done"))
                .body("goal.goal_id", equalTo(GOAL_IN_PROGRESS))
                .body("goal.progress_percent", equalTo(45));
    }
}

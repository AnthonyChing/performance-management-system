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
class EmployeeGoalControllerTest {

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/me";
    }

    @Test
    void getGoals_returnsCurrentCycleGoals() {
        given()
                .when()
                .get("/goals")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("cycle.cycle_id", equalTo("cycle_2026_q3"))
                .body("summary.total_count", equalTo(5))
                .body("goals.size()", equalTo(1))
                .body("goals[0].goal_id", equalTo("goal_001"))
                .body("available_actions.can_create_goal", equalTo(true));
    }

    @Test
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
                .body("historical_cycles[0].cycle_id", equalTo("cycle_2023_q4"));
    }

    @Test
    void getGoals_withHistoricalCycle_returnsGoals() {
        given()
                .when()
                .get("/goals?status=historical&cycleId=cycle_2025_annual")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_goals"))
                .body("cycle.cycle_id", equalTo("cycle_2025_annual"))
                .body("summary.completed_count", equalTo(1))
                .body("goals[0].goal_id", equalTo("goal_h_001"));
    }

    @Test
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
                .body("goal.goal_id", equalTo("goal_002"))
                .body("goal.title", equalTo("Increase test coverage"))
                .body("goal.status", equalTo("pending_review"))
                .body("goal.progress_percent", equalTo(0));
    }

    @Test
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
                .post("/goals/goal_123")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("goal.goal_id", equalTo("goal_123"))
                .body("goal.title", equalTo("Revised goal title"))
                .body("goal.status", equalTo("pending_review"));
    }

    @Test
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
                .post("/goals/goal_456/progress-updates")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("progress_update.progress_percent", equalTo(45))
                .body("progress_update.note", equalTo("Halfway done"))
                .body("goal.goal_id", equalTo("goal_456"))
                .body("goal.progress_percent", equalTo(45));
    }

    @Test
    void getGoalReviewResult_returnsReviewResult() {
        given()
                .when()
                .get("/goals/review-result?goalId=goal_789")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("overall_status", equalTo("in_progress"))
                .body("results[0].goal_id", equalTo("goal_789"))
                .body("reviewer.user_id", equalTo("user_100"));
    }
}

package com.pms.controller.manager;

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
class ManagerGoalControllerTest {

    // Manager UUID = TEAM_ID, token authenticates as this user
    private static final String MANAGER_ID            = "123e4567-e89b-12d3-a456-426614174020";
    private static final String USER_ID               = "123e4567-e89b-12d3-a456-426614174010";
    private static final String GOAL_ID               = "123e4567-e89b-12d3-a456-426614174000";
    private static final String LOCKED_GOAL_ID        = "123e4567-e89b-12d3-a456-426614174004";
    private static final String NON_SUBORDINATE_USER_ID = "00000000-0000-0000-0000-000000000099";

    @Autowired JwtUtil jwtUtil;
    @Autowired JdbcTemplate jdbc;

    @LocalServerPort
    int port;

    private String token;

    @BeforeAll
    void setUpAll() {
        token = jwtUtil.generateToken(UUID.fromString(MANAGER_ID), List.of("manager"));
        jdbc.update("""
                INSERT INTO goals (id, cycle_id, owner_id, set_by, goal_type, title, description,
                    progress_percent, due_date, status)
                VALUES (?::uuid, '123e4567-e89b-12d3-a456-426614174001'::uuid,
                    ?::uuid, ?::uuid, 'individual', '提升測試覆蓋率', '提升至 80% 以上',
                    0, '2026-09-30', 'pending_review')
                ON CONFLICT (id) DO UPDATE SET status = 'pending_review'
                """, GOAL_ID, USER_ID, USER_ID);
        jdbc.update("""
                INSERT INTO goals (id, cycle_id, owner_id, set_by, goal_type, title, description,
                    progress_percent, due_date, status)
                VALUES (?::uuid, '123e4567-e89b-12d3-a456-426614174002'::uuid,
                    ?::uuid, ?::uuid, 'individual', '舊週期目標', '舊週期',
                    0, '2025-09-30', 'pending_review')
                ON CONFLICT (id) DO UPDATE SET status = 'pending_review'
                """, LOCKED_GOAL_ID, USER_ID, USER_ID);
    }

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        RestAssured.requestSpecification = new RequestSpecBuilder()
                .setPort(port)
                .setBasePath("/api/v1/users")
                .addHeader("Authorization", "Bearer " + token)
                .build();
    }

    @Test @Order(1)
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

    @Test @Order(2)
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

    @Test @Order(3)
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

    @Test @Order(4)
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

    @Test @Order(5)
    void listGoals_returnsSubordinateGoals() {
        given()
                .when().get("/" + USER_ID + "/goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test @Order(6)
    void listGoals_withCycleIdFilter_returnsFilteredGoals() {
        given()
                .queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when().get("/" + USER_ID + "/goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test @Order(7)
    void listGoals_withStatusFilter_returnsFilteredGoals() {
        given()
                .queryParam("status", "in_progress")
                .when().get("/" + USER_ID + "/goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test @Order(8)
    void listGoals_forNonSubordinate_returns403() {
        given()
                .when().get("/" + NON_SUBORDINATE_USER_ID + "/goals")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test @Order(9)
    void listGoals_forNonExistentUser_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000/goals")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test @Order(10)
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

    @Test @Order(11)
    void reviewGoal_whenCycleLocked_returns409() {
        String body = """
                {
                  "status": "in_progress"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/goals/" + LOCKED_GOAL_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test @Order(12)
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

    @Test @Order(13)
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

    @Test @Order(14)
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
}

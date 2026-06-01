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
class ManagerAppealControllerTest {

    // TEAM_ID is the manager's own UUID — used as the teamId path param
    private static final String TEAM_ID = "123e4567-e89b-12d3-a456-426614174020";
    private static final String APPEAL_ID = "123e4567-e89b-12d3-a456-426614174050";

    @Autowired JwtUtil jwtUtil;
    @Autowired JdbcTemplate jdbc;

    @LocalServerPort int port;

    private String token;

    @BeforeAll
    void setUpAll() {
        token = jwtUtil.generateToken(UUID.fromString(TEAM_ID), List.of("manager"));
        jdbc.execute(
                "UPDATE appeals SET status = 'submitted', resolved_at = NULL WHERE id = '"
                        + APPEAL_ID
                        + "'");
        jdbc.execute("DELETE FROM appeal_responses WHERE appeal_id = '" + APPEAL_ID + "'");
    }

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        RestAssured.requestSpecification =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/teams")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    @Test
    @Order(1)
    void listAppeals_whenNotTeamManager_returns403() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000099/appeals")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(2)
    void listAppeals_whenTeamNotFound_returns404() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000000/appeals")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(3)
    void listAppeals_returnsTeamAppeals() {
        given().when()
                .get("/" + TEAM_ID + "/appeals")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue());
    }

    @Test
    @Order(4)
    void listAppeals_withStatusFilter_returnsFilteredAppeals() {
        given().queryParam("status", "submitted")
                .when()
                .get("/" + TEAM_ID + "/appeals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    @Order(5)
    void getAppeal_whenNotAuthorized_returns403() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000099/appeals/" + APPEAL_ID)
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(6)
    void getAppeal_whenAppealNotFound_returns404() {
        given().when()
                .get("/" + TEAM_ID + "/appeals/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(7)
    void getAppeal_returnsAppealDetail() {
        given().when()
                .get("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("id", equalTo(APPEAL_ID))
                .body("reason", notNullValue())
                .body("status", notNullValue());
    }

    @Test
    @Order(8)
    void respondToAppeal_withMissingResponseText_returns400() {
        String body =
                """
                {
                  "is_final": false
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(9)
    void respondToAppeal_whenNotAuthorized_returns403() {
        String body =
                """
                {
                  "response_text": "回應",
                  "is_final": false
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/00000000-0000-0000-0000-000000000099/appeals/" + APPEAL_ID)
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(10)
    void respondToAppeal_withNonFinalResponse_keepsAppealOpen() {
        String body =
                """
                {
                  "response_text": "已收到您的異議，目前正在審查中。",
                  "is_final": false
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .body("resolved_at", nullValue());
    }

    @Test
    @Order(11)
    void respondToAppeal_withFinalRejection_resolvesAppealAsRejected() {
        String body =
                """
                {
                  "response_text": "評分依據充分，異議不成立。",
                  "is_final": true,
                  "outcome": "rejected"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .body("id", equalTo(APPEAL_ID))
                .body("status", equalTo("rejected"))
                .body("resolved_at", notNullValue())
                .body("responses.is_final", hasItem(true));
    }

    @Test
    @Order(12)
    void respondToAppeal_whenAppealAlreadyResolved_returns409() {
        String body =
                """
                {
                  "response_text": "試圖對已結案異議再次回應",
                  "is_final": false
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    @Order(13)
    void respondToAppeal_withFinalApproval_resolvesAppealAsApproved() {
        jdbc.execute(
                "UPDATE appeals SET status = 'submitted', resolved_at = NULL WHERE id = '"
                        + APPEAL_ID + "'");
        jdbc.execute("DELETE FROM appeal_responses WHERE appeal_id = '" + APPEAL_ID + "'");

        String body =
                """
                {
                  "response_text": "經核對附檔確認，Q2 專案表現確有貢獻。已同步更新評分表內容。",
                  "is_final": true,
                  "outcome": "approved"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .body("id", equalTo(APPEAL_ID))
                .body("status", equalTo("approved"))
                .body("resolved_at", notNullValue())
                .body("responses.is_final", hasItem(true));
    }
}

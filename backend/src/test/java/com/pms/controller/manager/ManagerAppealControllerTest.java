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
class ManagerAppealControllerTest {

    private static final String TEAM_ID = "123e4567-e89b-12d3-a456-426614174020";
    private static final String APPEAL_ID = "123e4567-e89b-12d3-a456-426614174050";

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/teams";
    }

    @Test
    void listAppeals_returnsTeamAppeals() {
        given()
                .when().get("/" + TEAM_ID + "/appeals")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue());
    }

    @Test
    void listAppeals_withStatusFilter_returnsFilteredAppeals() {
        given()
                .queryParam("status", "submitted")
                .when().get("/" + TEAM_ID + "/appeals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listAppeals_whenNotTeamManager_returns403() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000099/appeals")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void listAppeals_whenTeamNotFound_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000/appeals")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void getAppeal_returnsAppealDetail() {
        given()
                .when().get("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("id", equalTo(APPEAL_ID))
                .body("reason", notNullValue())
                .body("status", notNullValue());
    }

    @Test
    void getAppeal_whenNotAuthorized_returns403() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000099/appeals/" + APPEAL_ID)
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void getAppeal_whenAppealNotFound_returns404() {
        given()
                .when().get("/" + TEAM_ID + "/appeals/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void respondToAppeal_withFinalResponse_resolvesAppeal() {
        String body = """
                {
                  "response_text": "經核對附檔確認，Q2 專案表現確有貢獻。已同步更新評分表內容。",
                  "is_final": true
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .body("id", equalTo(APPEAL_ID))
                .body("resolved_at", notNullValue())
                .body("responses[0].is_final", equalTo(true));
    }

    @Test
    void respondToAppeal_withNonFinalResponse_keepsAppealOpen() {
        String body = """
                {
                  "response_text": "已收到您的異議，目前正在審查中。",
                  "is_final": false
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(200)
                .body("resolved_at", nullValue());
    }

    @Test
    void respondToAppeal_withMissingResponseText_returns400() {
        String body = """
                {
                  "is_final": false
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void respondToAppeal_whenNotAuthorized_returns403() {
        String body = """
                {
                  "response_text": "回應",
                  "is_final": false
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/00000000-0000-0000-0000-000000000099/appeals/" + APPEAL_ID)
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void respondToAppeal_whenAppealAlreadyResolved_returns409() {
        String body = """
                {
                  "response_text": "試圖對已結案異議再次回應",
                  "is_final": false
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEAM_ID + "/appeals/" + APPEAL_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }
}

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
class ManagerKpiControllerTest {

    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174010";
    private static final String KPI_ID = "123e4567-e89b-12d3-a456-426614174030";
    private static final String NON_SUBORDINATE_USER_ID = "00000000-0000-0000-0000-000000000099";

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/users";
    }

    @Test
    void createKpi_returnsCreatedKpi() {
        String body = """
                {
                  "title": "季營收達成率",
                  "description": "達成個人季營收 100 萬的業績目標",
                  "kpi_type": "individual",
                  "unit": "NTD",
                  "target_value": 1000000.0
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + USER_ID + "/kpis")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("data[0].kpi_id", notNullValue())
                .body("data[0].title", equalTo("季營收達成率"))
                .body("data[0].kpi_type", equalTo("individual"))
                .body("data[0].assignment.target_value", equalTo(1000000.0f));
    }

    @Test
    void createKpi_withMissingTitle_returns400() {
        String body = """
                {
                  "kpi_type": "individual",
                  "target_value": 1000000.0
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + USER_ID + "/kpis")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void createKpi_forNonSubordinate_returns403() {
        String body = """
                {
                  "title": "非直屬部屬 KPI",
                  "target_value": 100.0
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + NON_SUBORDINATE_USER_ID + "/kpis")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void createKpi_forNonExistentUser_returns404() {
        String body = """
                {
                  "title": "查無此員工 KPI",
                  "target_value": 100.0
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/00000000-0000-0000-0000-000000000000/kpis")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test
    void updateKpi_returnsUpdatedKpi() {
        String body = """
                {
                  "target_value": 1200000.0,
                  "description": "追加業績目標調升"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/kpis/" + KPI_ID)
                .then()
                .statusCode(200)
                .body("kpi_id", equalTo(KPI_ID))
                .body("assignment.target_value", equalTo(1200000.0f))
                .body("description", equalTo("追加業績目標調升"));
    }

    @Test
    void updateKpi_whenKpiNotFound_returns404() {
        String body = """
                {
                  "target_value": 1200000.0
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/kpis/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void updateKpi_whenCycleLocked_returns409() {
        String body = """
                {
                  "target_value": 1200000.0
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + USER_ID + "/kpis/" + KPI_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void listKpis_returnsSubordinateKpis() {
        given()
                .when().get("/" + USER_ID + "/kpis")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listKpis_withCycleIdFilter_returnsFilteredKpis() {
        given()
                .queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when().get("/" + USER_ID + "/kpis")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listKpis_forNonSubordinate_returns403() {
        given()
                .when().get("/" + NON_SUBORDINATE_USER_ID + "/kpis")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    void listKpis_forNonExistentUser_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000/kpis")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }
}

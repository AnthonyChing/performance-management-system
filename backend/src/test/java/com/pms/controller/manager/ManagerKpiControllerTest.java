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
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ManagerKpiControllerTest {

    private static final String MANAGER_ID = "123e4567-e89b-12d3-a456-426614174020";
    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174010";
    private static final String KPI_ID = "123e4567-e89b-12d3-a456-426614174030";
    private static final String LOCKED_KPI_ID = "123e4567-e89b-12d3-a456-426614174031";
    private static final String NON_SUBORDINATE_USER_ID = "00000000-0000-0000-0000-000000000099";

    @Autowired JwtUtil jwtUtil;

    @LocalServerPort int port;

    private String token;

    @BeforeAll
    void setUpAll() {
        token = jwtUtil.generateToken(UUID.fromString(MANAGER_ID), List.of("manager"));
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
    void createKpi_withMissingTitle_returns400() {
        String body =
                """
                {
                  "kpi_type": "individual",
                  "target_value": 1000000.0
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + USER_ID + "/kpis")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    @Order(2)
    void createKpi_forNonSubordinate_returns403() {
        String body =
                """
                {
                  "title": "非直屬部屬 KPI",
                  "target_value": 100.0
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + NON_SUBORDINATE_USER_ID + "/kpis")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(3)
    void createKpi_forNonExistentUser_returns404() {
        String body =
                """
                {
                  "title": "查無此員工 KPI",
                  "target_value": 100.0
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/00000000-0000-0000-0000-000000000000/kpis")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test
    @Order(4)
    void listKpis_returnsSubordinateKpis() {
        given().when()
                .get("/" + USER_ID + "/kpis")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    @Order(5)
    void listKpis_withCycleIdFilter_returnsFilteredKpis() {
        given().queryParam("cycle_id", "123e4567-e89b-12d3-a456-426614174001")
                .when()
                .get("/" + USER_ID + "/kpis")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    @Order(6)
    void listKpis_forNonSubordinate_returns403() {
        given().when()
                .get("/" + NON_SUBORDINATE_USER_ID + "/kpis")
                .then()
                .statusCode(403)
                .body("error.code", equalTo("FORBIDDEN"));
    }

    @Test
    @Order(7)
    void listKpis_forNonExistentUser_returns404() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000000/kpis")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("SUBORDINATE_NOT_FOUND"));
    }

    @Test
    @Order(8)
    void updateKpi_whenKpiNotFound_returns404() {
        String body =
                """
                {
                  "target_value": 1200000.0
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/kpis/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(9)
    void updateKpi_whenCycleLocked_returns409() {
        String body =
                """
                {
                  "target_value": 1200000.0
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/kpis/" + LOCKED_KPI_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    @Order(10)
    void updateKpi_returnsUpdatedKpi() {
        String body =
                """
                {
                  "target_value": 1200000.0,
                  "description": "追加業績目標調升"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + USER_ID + "/kpis/" + KPI_ID)
                .then()
                .statusCode(200)
                .body("id", equalTo(KPI_ID))
                .body("assignment.target_value", equalTo(1200000.0f))
                .body("description", equalTo("追加業績目標調升"));
    }

    @Test
    @Order(11)
    void createKpi_returnsCreatedKpi() {
        String body =
                """
                {
                  "title": "季營收達成率",
                  "description": "達成個人季營收 100 萬的業績目標",
                  "kpi_type": "individual",
                  "unit": "NTD",
                  "target_value": 1000000.0
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + USER_ID + "/kpis")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("data[0].id", notNullValue())
                .body("data[0].title", equalTo("季營收達成率"))
                .body("data[0].kpi_type", equalTo("individual"))
                .body("data[0].assignment.target_value", equalTo(1000000.0f));
    }
}

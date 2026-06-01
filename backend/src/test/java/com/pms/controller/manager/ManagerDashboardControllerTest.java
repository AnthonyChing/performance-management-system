package com.pms.controller.manager;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class ManagerDashboardControllerTest {

    private static final String MANAGER_ID = "123e4567-e89b-12d3-a456-426614174020";
    private static final String CYCLE_ID = "123e4567-e89b-12d3-a456-426614174001";

    @LocalServerPort int port;
    @Autowired JwtUtil jwtUtil;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        String token = jwtUtil.generateToken(UUID.fromString(MANAGER_ID), List.of("manager"));
        requestSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/manager")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    @Test
    void listSubordinates_returnsSubordinateList() {
        given().spec(requestSpec)
                .when()
                .get("/subordinates")
                .then()
                .statusCode(200)
                .body("data", notNullValue())
                .body("data.size()", greaterThanOrEqualTo(1))
                .body("data[0].id", notNullValue())
                .body("data[0].name", notNullValue());
    }

    @Test
    void listAllSubordinateGoals_returnsGoalList() {
        given().spec(requestSpec)
                .queryParam("cycle_id", CYCLE_ID)
                .when()
                .get("/subordinates-goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listAllSubordinateGoals_withStatusFilter_returnsFiltered() {
        given().spec(requestSpec)
                .queryParam("cycle_id", CYCLE_ID)
                .queryParam("status", "pending_review")
                .when()
                .get("/subordinates-goals")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void listSubordinates_withoutToken_returns401() {
        given().port(port)
                .when()
                .get("/api/v1/manager/subordinates")
                .then()
                .statusCode(401);
    }
}

package com.pms.controller.employee;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class EmployeeProfileControllerTest {

    private static final String USER_ID  = "00000000-0000-0000-0000-0000000000c1";
    private static final String CYCLE_ID = "00000000-0000-0000-0000-000000010001";

    @LocalServerPort
    int port;

    @Autowired
    JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/api/v1/me";
        String token = jwtUtil.generateToken(UUID.fromString(USER_ID), List.of("employee"));
        RestAssured.requestSpecification = new RequestSpecBuilder()
                .addHeader("Authorization", "Bearer " + token)
                .build();
    }

    @Test
    void getProfile_returnsProfileWithCycleAndReview() {
        given()
                .when()
                .get("/profile")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("profile.user_id", equalTo(USER_ID))
                .body("profile.name", equalTo("Eric Lin"))
                .body("profile.employment_status", equalTo("active"))
                .body("cycle.cycle_id", equalTo(CYCLE_ID))
                .body("review.status", equalTo("self_eval_in_progress"));
    }

    @Test
    void getCurrentCycle_returnsCurrentCycle() {
        given()
                .when()
                .get("/performance-cycles/current")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("cycle.cycle_id", equalTo(CYCLE_ID))
                .body("cycle.status", equalTo("in_progress"))
                .body("cycle.is_locked", equalTo(false));
    }
}

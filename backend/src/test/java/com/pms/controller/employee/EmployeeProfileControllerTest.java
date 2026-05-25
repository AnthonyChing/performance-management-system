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
class EmployeeProfileControllerTest {

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/me";
    }

    @Test
    void getProfile_returnsProfileSummary() {
        given()
                .when()
                .get("/profile")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("profile.user_id", equalTo("user_001"))
                .body("profile.english_name", equalTo("David Chen"))
                .body("cycle.cycle_id", equalTo("cycle_2024_q3"))
                .body("review.status", equalTo("pending_manager_eval"));
    }

    @Test
    void getCurrentCycle_returnsCurrentCycle() {
        given()
                .when()
                .get("/performance-cycles/current")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("cycle.cycle_id", equalTo("cycle_2024_q3"))
                .body("cycle.status", equalTo("results_published"))
                .body("cycle.is_locked", equalTo(true));
    }
}

package com.pms.controller.hr;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;

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
class HrAssessmentStatusControllerTest {

    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";
    private static final String EMPLOYEE_ID = "00000000-0000-0000-0000-0000000000c1";
    private static final String CYCLE_ID = "00000000-0000-0000-0000-000000010001";

    @LocalServerPort int port;

    @Autowired JwtUtil jwtUtil;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();

        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        requestSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/hr/assessment-statuses")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    private RequestSpecification given() {
        return RestAssured.given().spec(requestSpec);
    }

    @Test
    void listAssessmentStatuses_returnsPagedStatuses() {
        given().when()
                .get()
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue())
                .body("data.review_id", hasItem("00000000-0000-0000-0000-000000020001"))
                .body("meta.current_page", equalTo(1))
                .body("meta.total_count", notNullValue());
    }

    @Test
    void listAssessmentStatuses_withFilters_returnsMatchingReview() {
        given().queryParam("cycle_id", CYCLE_ID)
                .queryParam("employee_id", EMPLOYEE_ID)
                .queryParam("review_status", "self_eval_in_progress")
                .when()
                .get()
                .then()
                .statusCode(200)
                .body("data.review_id", hasItem("00000000-0000-0000-0000-000000020001"))
                .body("data.employee_id", everyItem(equalTo(EMPLOYEE_ID)))
                .body("data.cycle_id", everyItem(equalTo(CYCLE_ID)))
                .body("data.review_status", everyItem(equalTo("self_eval_in_progress")));
    }

    @Test
    void listAssessmentStatuses_withoutToken_returns401() {
        RestAssured.reset();

        RestAssured.given()
                .port(port)
                .basePath("/api/v1/hr/assessment-statuses")
                .when()
                .get()
                .then()
                .statusCode(401)
                .body("error.code", equalTo("UNAUTHORIZED"));
    }
}

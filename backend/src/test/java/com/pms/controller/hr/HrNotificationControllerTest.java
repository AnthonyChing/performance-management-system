package com.pms.controller.hr;

import com.pms.config.TestcontainersConfig;
import com.pms.security.JwtUtil;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
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
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class HrNotificationControllerTest {

    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";

    @LocalServerPort
    int port;

    @Autowired
    JwtUtil jwtUtil;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();

        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        requestSpec = new RequestSpecBuilder()
                .setPort(port)
                .setBasePath("/api/v1/hr/notifications")
                .addHeader("Authorization", "Bearer " + token)
                .build();
    }

    private RequestSpecification given() {
        return RestAssured.given().spec(requestSpec);
    }

    @Test
    void sendNotification_returnsAcceptedMessage() {
        String body = """
                {
                  "cycle_id": "00000000-0000-0000-0000-000000010001",
                  "audience": "employees"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post()
                .then()
                .statusCode(202)
                .body("message", equalTo("Notification job queued."));
    }

    @Test
    void sendNotification_withoutToken_returns401() {
        RestAssured.reset();

        RestAssured.given()
                .port(port)
                .basePath("/api/v1/hr/notifications")
                .contentType("application/json")
                .body("{}")
                .when().post()
                .then()
                .statusCode(401)
                .body("error.code", equalTo("UNAUTHORIZED"));
    }
}

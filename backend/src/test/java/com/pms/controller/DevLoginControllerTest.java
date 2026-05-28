package com.pms.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import com.pms.config.TestcontainersConfig;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.flyway.locations=classpath:db/migration,classpath:db/test-seed")
@ActiveProfiles({"test", "dev"})
@Import(TestcontainersConfig.class)
class DevLoginControllerTest {

    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";
    private static final String HR_EMAIL = "helen.ho@acme.test";
    private static final String EMPLOYEE_ID = "00000000-0000-0000-0000-0000000000c1";

    @LocalServerPort int port;

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        RestAssured.port = port;
    }

    @Test
    void devLogin_withUserId_returnsToken() {
        RestAssured.given()
                .contentType("application/json")
                .body("{\"user_id\": \"" + HR_ID + "\"}")
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(200)
                .body("access_token", notNullValue())
                .body("token_type", equalTo("Bearer"))
                .body("user_id", equalTo(HR_ID))
                .body("roles[0]", equalTo("hr"));
    }

    @Test
    void devLogin_withEmail_returnsToken() {
        RestAssured.given()
                .contentType("application/json")
                .body("{\"email\": \"" + HR_EMAIL + "\"}")
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(200)
                .body("access_token", notNullValue())
                .body("user_id", equalTo(HR_ID))
                .body("roles[0]", equalTo("hr"));
    }

    @Test
    void devLogin_unknownUserId_returns404() {
        RestAssured.given()
                .contentType("application/json")
                .body("{\"user_id\": \"00000000-0000-0000-0000-000000000000\"}")
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("ACCOUNT_NOT_FOUND"));
    }

    @Test
    void devLogin_unknownEmail_returns404() {
        RestAssured.given()
                .contentType("application/json")
                .body("{\"email\": \"nobody@example.com\"}")
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("ACCOUNT_NOT_FOUND"));
    }

    @Test
    void devLogin_noFields_returns400() {
        RestAssured.given()
                .contentType("application/json")
                .body("{}")
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void devLogin_employeeUser_returnsEmployeeRole() {
        RestAssured.given()
                .contentType("application/json")
                .body("{\"user_id\": \"" + EMPLOYEE_ID + "\"}")
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(200)
                .body("user_id", equalTo(EMPLOYEE_ID))
                .body("roles[0]", equalTo("employee"));
    }
}

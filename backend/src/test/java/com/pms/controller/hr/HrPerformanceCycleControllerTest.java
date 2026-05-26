package com.pms.controller.hr;

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
class HrPerformanceCycleControllerTest {

    private static final String CYCLE_ID = "123e4567-e89b-12d3-a456-426614174001";

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/hr/performance-cycles";
    }

    @Test
    void createCycle_returnsCreatedCycle() {
        String body = """
                {
                  "name": "2026 總部員工績效考核",
                  "start_date": "2026-07-01",
                  "end_date": "2026-09-30",
                  "timezone": "Asia/Taipei",
                  "target_groups": []
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post()
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("name", equalTo("2026 總部員工績效考核"))
                .body("start_date", equalTo("2026-07-01"))
                .body("end_date", equalTo("2026-09-30"));
    }

    @Test
    void createCycle_withMissingName_returns400() {
        String body = """
                {
                  "start_date": "2026-07-01",
                  "end_date": "2026-09-30"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post()
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void listCycles_returnsPagedResult() {
        given()
                .when().get()
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue())
                .body("meta", notNullValue());
    }

    @Test
    void listCycles_withStatusFilter_returnsFiltered() {
        given()
                .queryParam("status", "in_progress")
                .when().get()
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getCycle_returnsCycleDetail() {
        given()
                .when().get("/" + CYCLE_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("id", equalTo(CYCLE_ID));
    }

    @Test
    void getCycle_withNonExistentId_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void updateCycle_returnsUpdatedCycle() {
        String body = """
                {
                  "name": "2026 總部員工績效考核 (修訂版)",
                  "end_date": "2026-10-15"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + CYCLE_ID)
                .then()
                .statusCode(200)
                .body("name", equalTo("2026 總部員工績效考核 (修訂版)"));
    }

    @Test
    void changeCycleStatus_toInProgress_returnsUpdatedCycle() {
        String body = """
                {
                  "status": "in_progress"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + CYCLE_ID + "/status")
                .then()
                .statusCode(200)
                .body("status", equalTo("in_progress"));
    }

    @Test
    void changeCycleStatus_toClosed_returnsUpdatedCycle() {
        String body = """
                {
                  "status": "closed"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + CYCLE_ID + "/status")
                .then()
                .statusCode(200)
                .body("status", equalTo("closed"));
    }

    @Test
    void changeCycleStatus_withInvalidStatus_returns400() {
        String body = """
                {
                  "status": "invalid_status"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + CYCLE_ID + "/status")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }
}

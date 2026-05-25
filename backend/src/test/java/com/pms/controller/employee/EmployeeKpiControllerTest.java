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
class EmployeeKpiControllerTest {

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/me";
    }

    @Test
    void getKpiStandards_returnsStandards() {
        given()
                .when()
                .get("/kpis/standards")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("cycle.cycle_id", equalTo("cycle_2024_q3"))
                .body("employee.user_id", equalTo("user_001"))
                .body("standards[0].kpi_id", equalTo("kpi_core_product_quality"));
    }

    @Test
    void getKpiResult_returnsCurrentResult() {
        given()
                .when()
                .get("/kpis/result")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("result.result_id", equalTo("kpi_result_2024_q3_user_001"))
                .body("result.status", equalTo("pending_confirmation"))
                .body("result.available_actions.can_confirm", equalTo(true));
    }

    @Test
    void confirmKpiResult_returnsConfirmation() {
        String requestBody = """
                {
                  "result_id": "kpi_result_2024_q3_user_001",
                  "confirmed": true
                }
                """;

        given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/kpis/result-confirmations")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("confirmation.result_id", equalTo("kpi_result_2024_q3_user_001"))
                .body("result.status", equalTo("confirmed"))
                .body("result.available_actions.can_confirm", equalTo(false))
                .body("result.available_actions.confirm_unavailable_reason", equalTo("already_confirmed"));
    }

    @Test
    void getHistoricalKpiResults_returnsList() {
        given()
                .when()
                .get("/kpis/result?status=historical")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_results"))
                .body("pagination.page", equalTo(1))
                .body("results.size()", equalTo(1))
                .body("results[0].result_id", equalTo("kpi_result_2023_q4_user_001"));
    }

    @Test
    void getHistoricalKpiResults_withCycle_returnsDetail() {
        given()
                .when()
                .get("/kpis/result?status=historical&cycleId=cycle_2024_q3")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("mode", equalTo("historical_result_detail"))
                .body("result.result_id", equalTo("kpi_result_2024_q3_user_001"))
                .body("standards[0].kpi_id", equalTo("kpi_core_product_quality"));
    }
}

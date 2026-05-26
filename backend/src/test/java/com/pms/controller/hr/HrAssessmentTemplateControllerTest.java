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
class HrAssessmentTemplateControllerTest {

    private static final String TEMPLATE_ID = "123e4567-e89b-12d3-a456-426614174000";
    private static final String QUESTION_ID = "123e4567-e89b-12d3-a456-426614174100";

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/hr/assessment-templates";
    }

    // --- Template CRUD ---

    @Test
    void createTemplate_returnsCreatedDraftTemplate() {
        String body = """
                {
                  "name": "2026 業務部年度考核問卷",
                  "description": "業務與銷售相關同仁適用",
                  "job_function": "sales"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post()
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("name", equalTo("2026 業務部年度考核問卷"))
                .body("status", equalTo("draft"))
                .body("is_active", equalTo(true))
                .body("job_function", equalTo("sales"));
    }

    @Test
    void createTemplate_withMissingName_returns400() {
        String body = """
                {
                  "description": "Missing name"
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
    void listTemplates_returnsPagedResult() {
        given()
                .when().get()
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue())
                .body("meta.current_page", equalTo(1));
    }

    @Test
    void listTemplates_withStatusFilter_returnsFiltered() {
        given()
                .queryParam("status", "draft")
                .when().get()
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getTemplate_returnsTemplateDetail() {
        given()
                .when().get("/" + TEMPLATE_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("id", equalTo(TEMPLATE_ID));
    }

    @Test
    void getTemplate_withNonExistentId_returns404() {
        given()
                .when().get("/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void updateTemplate_returnsUpdatedTemplate() {
        String body = """
                {
                  "description": "業務與銷售相關同仁適用 (更新版)"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEMPLATE_ID)
                .then()
                .statusCode(200)
                .body("description", equalTo("業務與銷售相關同仁適用 (更新版)"));
    }

    @Test
    void deleteTemplate_returnsNoContent() {
        given()
                .when().delete("/" + TEMPLATE_ID)
                .then()
                .statusCode(204);
    }

    @Test
    void deleteTemplate_whenInUse_returns409() {
        given()
                .when().delete("/" + TEMPLATE_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void publishTemplate_returnsPublishedStatus() {
        given()
                .when().post("/" + TEMPLATE_ID + "/publish")
                .then()
                .statusCode(200)
                .body("status", equalTo("published"));
    }

    @Test
    void publishTemplate_whenAlreadyPublished_returns409() {
        given()
                .when().post("/" + TEMPLATE_ID + "/publish")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void publishTemplate_withNoQuestions_returns400() {
        given()
                .when().post("/" + TEMPLATE_ID + "/publish")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void duplicateTemplate_returnsNewDraftTemplate() {
        given()
                .when().post("/" + TEMPLATE_ID + "/duplicate")
                .then()
                .statusCode(201)
                .body("status", equalTo("draft"))
                .body("is_active", equalTo(true));
    }

    // --- Question operations ---

    @Test
    void addQuestion_returnsCreatedQuestion() {
        String body = """
                {
                  "question_text": "在過去一季中，該員工的程式碼品質符合團隊標準的程度？",
                  "question_type": "rating",
                  "rating_scale_max": 5,
                  "is_required": true
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + TEMPLATE_ID + "/questions")
                .then()
                .statusCode(201)
                .body("question_type", equalTo("rating"))
                .body("rating_scale_max", equalTo(5))
                .body("is_required", equalTo(true));
    }

    @Test
    void addQuestion_ratingWithoutScale_returns400() {
        String body = """
                {
                  "question_text": "評分問題缺少 scale",
                  "question_type": "rating"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + TEMPLATE_ID + "/questions")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void addQuestion_whenTemplatePublished_returns409() {
        String body = """
                {
                  "question_text": "新增到已發布模板",
                  "question_type": "text"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + TEMPLATE_ID + "/questions")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void listQuestions_returnsOrderedQuestions() {
        given()
                .when().get("/" + TEMPLATE_ID + "/questions")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getQuestion_returnsQuestionDetail() {
        given()
                .when().get("/" + TEMPLATE_ID + "/questions/" + QUESTION_ID)
                .then()
                .statusCode(200)
                .body("id", equalTo(QUESTION_ID));
    }

    @Test
    void updateQuestion_returnsUpdatedQuestion() {
        String body = """
                {
                  "question_text": "該員工具備良好的跨部門溝通能力嗎？"
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEMPLATE_ID + "/questions/" + QUESTION_ID)
                .then()
                .statusCode(200)
                .body("question_text", equalTo("該員工具備良好的跨部門溝通能力嗎？"));
    }

    @Test
    void deleteQuestion_returnsNoContent() {
        given()
                .when().delete("/" + TEMPLATE_ID + "/questions/" + QUESTION_ID)
                .then()
                .statusCode(204);
    }

    @Test
    void reorderQuestions_returnsSuccessMessage() {
        String body = """
                {
                  "ordered_question_ids": [
                    "123e4567-e89b-12d3-a456-426614174101",
                    "123e4567-e89b-12d3-a456-426614174100"
                  ]
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEMPLATE_ID + "/questions/reorder")
                .then()
                .statusCode(200);
    }

    @Test
    void reorderQuestions_withMismatchedCount_returns400() {
        String body = """
                {
                  "ordered_question_ids": []
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().patch("/" + TEMPLATE_ID + "/questions/reorder")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void applyTemplate_returnsSuccessMessage() {
        String body = """
                {
                  "target_departments": ["123e4567-e89b-12d3-a456-426614174000"],
                  "target_job_levels": ["L3", "L4"]
                }
                """;

        given()
                .contentType("application/json")
                .body(body)
                .when().post("/" + TEMPLATE_ID + "/applications")
                .then()
                .statusCode(200);
    }
}

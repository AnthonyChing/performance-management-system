package com.pms.controller.hr;

import static org.hamcrest.Matchers.equalTo;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class HrAssessmentTemplateControllerTest {

    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";
    private static final String DRAFT_TEMPLATE_ID = "123e4567-e89b-12d3-a456-4266141740d1";
    private static final String NO_QUESTION_TEMPLATE_ID = "123e4567-e89b-12d3-a456-4266141740d2";
    private static final String PUBLISHED_TEMPLATE_ID = "123e4567-e89b-12d3-a456-4266141740d3";
    private static final String IN_USE_TEMPLATE_ID = "123e4567-e89b-12d3-a456-4266141740d4";
    private static final String QUESTION_ID = "123e4567-e89b-12d3-a456-4266141741d1";
    private static final String SECOND_QUESTION_ID = "123e4567-e89b-12d3-a456-4266141741d2";
    private static final String IN_USE_CYCLE_ID = "00000000-0000-0000-0000-000000010001";

    @LocalServerPort int port;

    @Autowired JwtUtil jwtUtil;

    @Autowired JdbcTemplate jdbc;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();

        List<String> templateIds =
                List.of(
                        DRAFT_TEMPLATE_ID,
                        NO_QUESTION_TEMPLATE_ID,
                        PUBLISHED_TEMPLATE_ID,
                        IN_USE_TEMPLATE_ID);
        for (String templateId : templateIds) {
            jdbc.update(
                    "DELETE FROM cycle_template_assignments WHERE template_id = ?::uuid",
                    templateId);
            jdbc.update("DELETE FROM template_versions WHERE template_id = ?::uuid", templateId);
            jdbc.update("DELETE FROM template_questions WHERE template_id = ?::uuid", templateId);
            jdbc.update("DELETE FROM assessment_templates WHERE id = ?::uuid", templateId);
        }

        insertTemplate(DRAFT_TEMPLATE_ID, "HR Test Draft Template", "draft");
        insertTemplate(NO_QUESTION_TEMPLATE_ID, "HR Test Empty Template", "draft");
        insertTemplate(PUBLISHED_TEMPLATE_ID, "HR Test Published Template", "published");
        insertTemplate(IN_USE_TEMPLATE_ID, "HR Test In Use Template", "published");
        insertQuestion(DRAFT_TEMPLATE_ID, QUESTION_ID, "整體工作表現評分", "rating", 5, 0);
        insertQuestion(DRAFT_TEMPLATE_ID, SECOND_QUESTION_ID, "跨部門溝通能力", "text", null, 1);
        insertQuestion(
                PUBLISHED_TEMPLATE_ID,
                "123e4567-e89b-12d3-a456-4266141741d3",
                "已發布模板問題",
                "text",
                null,
                0);
        insertQuestion(
                IN_USE_TEMPLATE_ID,
                "123e4567-e89b-12d3-a456-4266141741d4",
                "已使用模板問題",
                "text",
                null,
                0);
        jdbc.update(
                """
                INSERT INTO cycle_template_assignments (cycle_id, template_id, assigned_by)
                VALUES (?::uuid, ?::uuid, ?::uuid)
                ON CONFLICT (cycle_id, template_id) DO NOTHING
                """,
                IN_USE_CYCLE_ID,
                IN_USE_TEMPLATE_ID,
                HR_ID);

        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        requestSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/hr/assessment-templates")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    private RequestSpecification given() {
        return RestAssured.given().spec(requestSpec);
    }

    private void insertTemplate(String id, String name, String status) {
        jdbc.update(
                """
                INSERT INTO assessment_templates
                    (id, name, description, job_category, status, is_active, created_by, updated_by)
                VALUES
                    (?::uuid, ?, 'Template for HR controller tests', 'engineering',
                     ?, true, ?::uuid, ?::uuid)
                """,
                id,
                name,
                status,
                HR_ID,
                HR_ID);
    }

    private void insertQuestion(
            String templateId,
            String questionId,
            String text,
            String type,
            Integer ratingScaleMax,
            int sortOrder) {
        jdbc.update(
                """
                INSERT INTO template_questions
                    (id, template_id, question_text, question_type, rating_scale_max,
                     is_required, sort_order, created_by, updated_by)
                VALUES
                    (?::uuid, ?::uuid, ?, ?, ?, true, ?, ?::uuid, ?::uuid)
                """,
                questionId,
                templateId,
                text,
                type,
                ratingScaleMax,
                sortOrder,
                HR_ID,
                HR_ID);
    }

    @Test
    void createTemplate_returnsCreatedDraftTemplate() {
        String body =
                """
                {
                  "name": "2026 業務部年度考核問卷",
                  "description": "業務與銷售相關同仁適用",
                  "job_category": "sales"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("name", equalTo("2026 業務部年度考核問卷"))
                .body("status", equalTo("draft"))
                .body("is_active", equalTo(true))
                .body("job_category", equalTo("sales"));
    }

    @Test
    void createTemplate_withMissingName_returns400() {
        String body =
                """
                {
                  "description": "Missing name"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void listTemplates_returnsPagedResult() {
        given().when()
                .get()
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("data", notNullValue())
                .body("meta.current_page", equalTo(1));
    }

    @Test
    void listTemplates_withStatusFilter_returnsFiltered() {
        given().queryParam("status", "draft")
                .when()
                .get()
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getTemplate_returnsTemplateDetail() {
        given().when()
                .get("/" + DRAFT_TEMPLATE_ID)
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("id", equalTo(DRAFT_TEMPLATE_ID));
    }

    @Test
    void getTemplate_withNonExistentId_returns404() {
        given().when()
                .get("/00000000-0000-0000-0000-000000000000")
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    @Test
    void updateTemplate_returnsUpdatedTemplate() {
        String body =
                """
                {
                  "description": "業務與銷售相關同仁適用 (更新版)"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + DRAFT_TEMPLATE_ID)
                .then()
                .statusCode(200)
                .body("description", equalTo("業務與銷售相關同仁適用 (更新版)"));
    }

    @Test
    void deleteTemplate_returnsNoContent() {
        given().when().delete("/" + DRAFT_TEMPLATE_ID).then().statusCode(204);
    }

    @Test
    void deleteTemplate_whenInUse_returns409() {
        given().when()
                .delete("/" + IN_USE_TEMPLATE_ID)
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void publishTemplate_returnsPublishedStatus() {
        given().when()
                .post("/" + DRAFT_TEMPLATE_ID + "/publish")
                .then()
                .statusCode(200)
                .body("status", equalTo("published"));
    }

    @Test
    void publishTemplate_whenAlreadyPublished_returns409() {
        given().when()
                .post("/" + PUBLISHED_TEMPLATE_ID + "/publish")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void publishTemplate_withNoQuestions_returns400() {
        given().when()
                .post("/" + NO_QUESTION_TEMPLATE_ID + "/publish")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void duplicateTemplate_returnsNewDraftTemplate() {
        given().when()
                .post("/" + DRAFT_TEMPLATE_ID + "/duplicate")
                .then()
                .statusCode(201)
                .body("status", equalTo("draft"))
                .body("is_active", equalTo(true));
    }

    @Test
    void addQuestion_returnsCreatedQuestion() {
        String body =
                """
                {
                  "question_text": "在過去一季中，該員工的程式碼品質符合團隊標準的程度？",
                  "question_type": "rating",
                  "rating_scale_max": 5,
                  "is_required": true
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + DRAFT_TEMPLATE_ID + "/questions")
                .then()
                .statusCode(201)
                .body("question_type", equalTo("rating"))
                .body("rating_scale_max", equalTo(5))
                .body("is_required", equalTo(true));
    }

    @Test
    void addQuestion_ratingWithoutScale_returns400() {
        String body =
                """
                {
                  "question_text": "評分問題缺少 scale",
                  "question_type": "rating"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + DRAFT_TEMPLATE_ID + "/questions")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void addQuestion_whenTemplatePublished_returns409() {
        String body =
                """
                {
                  "question_text": "新增到已發布模板",
                  "question_type": "text"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + PUBLISHED_TEMPLATE_ID + "/questions")
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void listQuestions_returnsOrderedQuestions() {
        given().when()
                .get("/" + DRAFT_TEMPLATE_ID + "/questions")
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    @Test
    void getQuestion_returnsQuestionDetail() {
        given().when()
                .get("/" + DRAFT_TEMPLATE_ID + "/questions/" + QUESTION_ID)
                .then()
                .statusCode(200)
                .body("id", equalTo(QUESTION_ID));
    }

    @Test
    void updateQuestion_returnsUpdatedQuestion() {
        String body =
                """
                {
                  "question_text": "該員工具備良好的跨部門溝通能力嗎？"
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + DRAFT_TEMPLATE_ID + "/questions/" + QUESTION_ID)
                .then()
                .statusCode(200)
                .body("question_text", equalTo("該員工具備良好的跨部門溝通能力嗎？"));
    }

    @Test
    void deleteQuestion_returnsNoContent() {
        given().when()
                .delete("/" + DRAFT_TEMPLATE_ID + "/questions/" + QUESTION_ID)
                .then()
                .statusCode(204);
    }

    @Test
    void reorderQuestions_returnsSuccessMessage() {
        String body =
                """
                {
                  "ordered_question_ids": [
                    "123e4567-e89b-12d3-a456-4266141741d2",
                    "123e4567-e89b-12d3-a456-4266141741d1"
                  ]
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + DRAFT_TEMPLATE_ID + "/questions/reorder")
                .then()
                .statusCode(200);
    }

    @Test
    void reorderQuestions_withMismatchedCount_returns400() {
        String body =
                """
                {
                  "ordered_question_ids": []
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/" + DRAFT_TEMPLATE_ID + "/questions/reorder")
                .then()
                .statusCode(400)
                .body("error.code", equalTo("VALIDATION_ERROR"));
    }

    @Test
    void applyTemplate_returnsSuccessMessage() {
        String body =
                """
                {
                  "target_departments": ["00000000-0000-0000-0000-000000000111"],
                  "target_job_levels": ["L3", "L4"]
                }
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .post("/" + DRAFT_TEMPLATE_ID + "/applications")
                .then()
                .statusCode(200)
                .body("message", equalTo("Template applied successfully to selected groups."));
    }
}

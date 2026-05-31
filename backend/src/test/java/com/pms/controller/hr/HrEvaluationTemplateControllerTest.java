package com.pms.controller.hr;

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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class HrEvaluationTemplateControllerTest {

    // ---- constant UUIDs ----
    private static final String HR_ID = "00000000-0000-0000-0000-0000000000a1";
    private static final String IN_PROGRESS_CYCLE_ID = "00000000-0000-0000-0000-000000010001";
    private static final String NOT_STARTED_CYCLE_ID = "ee000000-0000-0000-0000-000000000010";
    private static final String PUBLISHED_A_ID = "ee000000-0000-0000-0000-000000000001";
    private static final String PUBLISHED_B_ID = "ee000000-0000-0000-0000-000000000002";
    private static final String DRAFT_TMPL_ID = "ee000000-0000-0000-0000-000000000003";
    private static final String VERSION_A_ID = "ee000000-0000-0000-0000-000000000011";
    private static final String VERSION_B_ID = "ee000000-0000-0000-0000-000000000012";
    private static final String EVAL_TEMPLATE_ID = "ee000000-0000-0000-0000-000000000100";
    private static final String DEPT_ID = "00000000-0000-0000-0000-000000000111";

    @LocalServerPort int port;

    @Autowired JwtUtil jwtUtil;
    @Autowired JdbcTemplate jdbc;

    private RequestSpecification requestSpec;

    @BeforeEach
    void setUp() {
        RestAssured.reset();
        cleanUp();
        insertNotStartedCycle();
        insertAssessmentTemplates();
        insertEvaluationTemplate();

        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        requestSpec =
                new RequestSpecBuilder()
                        .setPort(port)
                        .setBasePath("/api/v1/hr/evaluation-templates")
                        .addHeader("Authorization", "Bearer " + token)
                        .build();
    }

    private RequestSpecification given() {
        return RestAssured.given().spec(requestSpec);
    }

    // ---- setup helpers ----

    private void cleanUp() {
        // Delete components first (FK child), then templates
        jdbc.update(
                """
                DELETE FROM evaluation_template_components
                WHERE evaluation_template_id IN (
                    SELECT id FROM evaluation_templates WHERE cycle_id = ?::uuid
                )
                """,
                NOT_STARTED_CYCLE_ID);
        jdbc.update(
                "DELETE FROM evaluation_template_components WHERE evaluation_template_id = ?::uuid",
                EVAL_TEMPLATE_ID);
        // Delete in-progress eval template used by STATE_CONFLICT test if leftover
        jdbc.update(
                "DELETE FROM evaluation_templates WHERE id = ?::uuid",
                "ee000000-0000-0000-0000-000000000200");
        jdbc.update("DELETE FROM evaluation_templates WHERE id = ?::uuid", EVAL_TEMPLATE_ID);
        jdbc.update(
                "DELETE FROM evaluation_templates WHERE cycle_id = ?::uuid", NOT_STARTED_CYCLE_ID);
        jdbc.update(
                "DELETE FROM template_versions WHERE id IN (?::uuid, ?::uuid)",
                VERSION_A_ID,
                VERSION_B_ID);
        jdbc.update(
                "DELETE FROM template_questions WHERE template_id IN (?::uuid, ?::uuid, ?::uuid)",
                PUBLISHED_A_ID,
                PUBLISHED_B_ID,
                DRAFT_TMPL_ID);
        jdbc.update(
                "DELETE FROM assessment_templates WHERE id IN (?::uuid, ?::uuid, ?::uuid)",
                PUBLISHED_A_ID,
                PUBLISHED_B_ID,
                DRAFT_TMPL_ID);
        jdbc.update("DELETE FROM performance_cycles WHERE id = ?::uuid", NOT_STARTED_CYCLE_ID);
    }

    private void insertNotStartedCycle() {
        jdbc.update(
                """
                INSERT INTO performance_cycles
                    (id, name, cycle_type, status, timezone,
                     cycle_start, cycle_end,
                     manager_eval_start, manager_eval_end,
                     hr_review_end, appeal_deadline_days, is_locked, created_by)
                VALUES
                    (?::uuid, 'Eval Template Test Cycle', 'annual', 'not_started', 'Asia/Taipei',
                     '2027-01-01T00:00:00+08:00', '2027-03-31T23:59:59+08:00',
                     '2027-04-01T00:00:00+08:00', '2027-06-30T23:59:59+08:00',
                     '2027-07-15T23:59:59+08:00', 7, false, ?::uuid)
                ON CONFLICT (id) DO NOTHING
                """,
                NOT_STARTED_CYCLE_ID,
                HR_ID);
    }

    private void insertAssessmentTemplates() {
        for (String[] t :
                new String[][] {
                    {PUBLISHED_A_ID, "核心勝任力評估", "published", VERSION_A_ID},
                    {PUBLISHED_B_ID, "業務目標達成", "published", VERSION_B_ID}
                }) {
            jdbc.update(
                    """
                    INSERT INTO assessment_templates (id, name, status, is_active, created_by, updated_by)
                    VALUES (?::uuid, ?, ?, true, ?::uuid, ?::uuid)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    t[0],
                    t[1],
                    t[2],
                    HR_ID,
                    HR_ID);
            jdbc.update(
                    """
                    INSERT INTO template_versions (id, template_id, version, created_at)
                    VALUES (?::uuid, ?::uuid, 1, now())
                    ON CONFLICT (id) DO NOTHING
                    """,
                    t[3],
                    t[0]);
            jdbc.update(
                    """
                    INSERT INTO template_questions
                        (id, template_id, question_text, question_type, is_required, sort_order, created_by, updated_by)
                    VALUES (?::uuid, ?::uuid, '評分問題', 'rating', true, 1, ?::uuid, ?::uuid)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    UUID.randomUUID().toString(),
                    t[0],
                    HR_ID,
                    HR_ID);
        }
        jdbc.update(
                """
                INSERT INTO assessment_templates (id, name, status, is_active, created_by, updated_by)
                VALUES (?::uuid, 'Draft Template', 'draft', true, ?::uuid, ?::uuid)
                ON CONFLICT (id) DO NOTHING
                """,
                DRAFT_TMPL_ID,
                HR_ID,
                HR_ID);
    }

    private void insertEvaluationTemplate() {
        jdbc.update(
                """
                INSERT INTO evaluation_templates
                    (id, cycle_id, name, description, status,
                     employee_group_type, employee_group_ref,
                     is_active, created_by, updated_by)
                VALUES
                    (?::uuid, ?::uuid, '2027 研發部門考核', '研發部門年度考核', 'published',
                     'department', ?,
                     true, ?::uuid, ?::uuid)
                ON CONFLICT (id) DO NOTHING
                """,
                EVAL_TEMPLATE_ID,
                NOT_STARTED_CYCLE_ID,
                DEPT_ID,
                HR_ID,
                HR_ID);
        jdbc.update(
                """
                INSERT INTO evaluation_template_components
                    (id, evaluation_template_id, assessment_template_id,
                     assessment_template_version_id, weight_percent, sort_order)
                VALUES
                    (?::uuid, ?::uuid, ?::uuid, ?::uuid, 60.00, 0)
                ON CONFLICT (evaluation_template_id, assessment_template_id) DO NOTHING
                """,
                UUID.randomUUID().toString(),
                EVAL_TEMPLATE_ID,
                PUBLISHED_A_ID,
                VERSION_A_ID);
        jdbc.update(
                """
                INSERT INTO evaluation_template_components
                    (id, evaluation_template_id, assessment_template_id,
                     assessment_template_version_id, weight_percent, sort_order)
                VALUES
                    (?::uuid, ?::uuid, ?::uuid, ?::uuid, 40.00, 1)
                ON CONFLICT (evaluation_template_id, assessment_template_id) DO NOTHING
                """,
                UUID.randomUUID().toString(),
                EVAL_TEMPLATE_ID,
                PUBLISHED_B_ID,
                VERSION_B_ID);
    }

    // ---- GET /hr/evaluation-templates/{id} ----

    @Test
    void getEvaluationTemplate_success() {
        given().when()
                .get("/{id}", EVAL_TEMPLATE_ID)
                .then()
                .statusCode(200)
                .body("template_id", equalTo(EVAL_TEMPLATE_ID))
                .body("name", equalTo("2027 研發部門考核"))
                .body("status", equalTo("published"))
                .body("cycle.status", equalTo("not_started"))
                .body("employee_group.group_type", equalTo("department"))
                .body("assessment_templates", hasSize(2))
                .body("total_weight_percent", equalTo(100.0f))
                .body("available_actions.can_edit", equalTo(true))
                .body("available_actions.can_archive", equalTo(true))
                .body("available_actions.edit_blocked_reason", nullValue());
    }

    @Test
    void getEvaluationTemplate_notFound_returns404() {
        given().when()
                .get("/{id}", UUID.randomUUID())
                .then()
                .statusCode(404)
                .body("error.code", equalTo("RESOURCE_NOT_FOUND"));
    }

    // ---- POST /hr/evaluation-templates ----

    @Test
    void createEvaluationTemplate_success() {
        String body =
                """
                {
                  "cycle_id": "%s",
                  "name": "2027 全體員工績效考核",
                  "description": "年度績效考核",
                  "employee_group_id": "all",
                  "assessment_templates": [
                    {"assessment_template_id": "%s", "weight_percent": 60},
                    {"assessment_template_id": "%s", "weight_percent": 40}
                  ]
                }
                """
                        .formatted(NOT_STARTED_CYCLE_ID, PUBLISHED_A_ID, PUBLISHED_B_ID);

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(201)
                .body("name", equalTo("2027 全體員工績效考核"))
                .body("status", equalTo("published"))
                .body("employee_group.group_type", equalTo("all"))
                .body("assessment_templates", hasSize(2))
                .body("total_weight_percent", equalTo(100.0f))
                .body("available_actions.can_edit", equalTo(true));
    }

    @Test
    void createEvaluationTemplate_weightSumNot100_returns400() {
        String body =
                """
                {
                  "cycle_id": "%s",
                  "name": "Invalid Weight Template",
                  "employee_group_id": "all",
                  "assessment_templates": [
                    {"assessment_template_id": "%s", "weight_percent": 60},
                    {"assessment_template_id": "%s", "weight_percent": 30}
                  ]
                }
                """
                        .formatted(NOT_STARTED_CYCLE_ID, PUBLISHED_A_ID, PUBLISHED_B_ID);

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(400)
                .body("error.code", equalTo("WEIGHT_SUM_INVALID"));
    }

    @Test
    void createEvaluationTemplate_assessmentTemplateNotPublished_returns409() {
        String body =
                """
                {
                  "cycle_id": "%s",
                  "name": "Template with Draft",
                  "employee_group_id": "all",
                  "assessment_templates": [
                    {"assessment_template_id": "%s", "weight_percent": 100}
                  ]
                }
                """
                        .formatted(NOT_STARTED_CYCLE_ID, DRAFT_TMPL_ID);

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(409)
                .body("error.code", equalTo("ASSESSMENT_TEMPLATE_NOT_PUBLISHED"));
    }

    @Test
    void createEvaluationTemplate_cycleInProgress_returns409() {
        String body =
                """
                {
                  "cycle_id": "%s",
                  "name": "Should Fail",
                  "employee_group_id": "all",
                  "assessment_templates": [
                    {"assessment_template_id": "%s", "weight_percent": 100}
                  ]
                }
                """
                        .formatted(IN_PROGRESS_CYCLE_ID, PUBLISHED_A_ID);

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(409)
                .body("error.code", equalTo("STATE_CONFLICT"));
    }

    @Test
    void createEvaluationTemplate_cycleNotFound_returns404() {
        String body =
                """
                {
                  "cycle_id": "%s",
                  "name": "Should Fail",
                  "employee_group_id": "all",
                  "assessment_templates": [
                    {"assessment_template_id": "%s", "weight_percent": 100}
                  ]
                }
                """
                        .formatted(UUID.randomUUID(), PUBLISHED_A_ID);

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(404)
                .body("error.code", equalTo("CYCLE_NOT_FOUND"));
    }

    @Test
    void createEvaluationTemplate_duplicateCycleGroup_returns409() {
        // EVAL_TEMPLATE_ID already uses NOT_STARTED_CYCLE_ID + department:DEPT_ID
        String body =
                """
                {
                  "cycle_id": "%s",
                  "name": "Duplicate Template",
                  "employee_group_id": "department:%s",
                  "assessment_templates": [
                    {"assessment_template_id": "%s", "weight_percent": 100}
                  ]
                }
                """
                        .formatted(NOT_STARTED_CYCLE_ID, DEPT_ID, PUBLISHED_A_ID);

        given().contentType("application/json")
                .body(body)
                .when()
                .post()
                .then()
                .statusCode(409)
                .body("error.code", equalTo("CYCLE_TEMPLATE_CONFLICT"));
    }

    // ---- PATCH /hr/evaluation-templates/{id} ----

    @Test
    void patchEvaluationTemplate_name_success() {
        String body =
                """
                {"name": "2027 研發部門考核 (修正版)"}
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/{id}", EVAL_TEMPLATE_ID)
                .then()
                .statusCode(200)
                .body("template_id", equalTo(EVAL_TEMPLATE_ID))
                .body("name", equalTo("2027 研發部門考核 (修正版)"));
    }

    @Test
    void patchEvaluationTemplate_archive_success() {
        String body =
                """
                {"status": "archived"}
                """;

        given().contentType("application/json")
                .body(body)
                .when()
                .patch("/{id}", EVAL_TEMPLATE_ID)
                .then()
                .statusCode(200)
                .body("status", equalTo("archived"))
                .body("available_actions.can_edit", equalTo(false))
                .body("available_actions.edit_blocked_reason", equalTo("TEMPLATE_ARCHIVED"));
    }

    @Test
    void patchEvaluationTemplate_cycleInProgress_returns409() {
        // Insert an eval template bound to an in-progress cycle
        String inProgressEvalId = "ee000000-0000-0000-0000-000000000200";
        jdbc.update(
                """
                INSERT INTO evaluation_templates
                    (id, cycle_id, name, status, employee_group_type,
                     is_active, created_by, updated_by)
                VALUES (?::uuid, ?::uuid, 'In Progress Cycle Template', 'published',
                        'all', true, ?::uuid, ?::uuid)
                ON CONFLICT (id) DO NOTHING
                """,
                inProgressEvalId,
                IN_PROGRESS_CYCLE_ID,
                HR_ID,
                HR_ID);

        try {
            given().contentType("application/json")
                    .body(
                            """
                            {"name": "Should Fail"}
                            """)
                    .when()
                    .patch("/{id}", inProgressEvalId)
                    .then()
                    .statusCode(409)
                    .body("error.code", equalTo("STATE_CONFLICT"));
        } finally {
            jdbc.update("DELETE FROM evaluation_templates WHERE id = ?::uuid", inProgressEvalId);
        }
    }

    // ---- GET /hr/evaluation-templates ----

    @Test
    void listEvaluationTemplates_success() {
        given().when()
                .get()
                .then()
                .statusCode(200)
                .body("data", notNullValue())
                .body("meta.current_page", equalTo(1))
                .body("meta.total_count", greaterThanOrEqualTo(1));
    }

    @Test
    void listEvaluationTemplates_filterByStatus() {
        given().queryParam("status", "published")
                .when()
                .get()
                .then()
                .statusCode(200)
                .body("data", notNullValue());
    }

    // ---- GET /hr/employee-groups ----

    @Test
    void getEmployeeGroups_success() {
        String token = jwtUtil.generateToken(UUID.fromString(HR_ID), List.of("hr"));
        RestAssured.given()
                .port(port)
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/v1/hr/employee-groups")
                .then()
                .statusCode(200)
                .body("data", notNullValue())
                .body("data[0].group_id", equalTo("all"))
                .body("data[0].group_type", equalTo("all"));
    }
}

package com.pms.migration;

import static org.assertj.core.api.Assertions.assertThat;

import com.pms.config.TestcontainersConfig;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifies that Flyway migration V1__init_org.sql applies cleanly against a real PostgreSQL
 * container and produces the schema described in docs/database/new-schema.md (Identity & Org
 * section).
 *
 * <p>Spring Boot runs Flyway during context startup, so reaching the assertions already proves the
 * migration executed without error. Each test then sanity-checks a specific aspect: tables present,
 * enums present, seed roles, and the partial unique index that guards "at most one open department
 * membership per user".
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
@Transactional // each test method rolls back, so the reused Testcontainers DB stays clean
class V1InitOrgMigrationTest {

    @Autowired private JdbcTemplate jdbc;

    @Test
    @DisplayName("All expected tables exist in the public schema")
    void tables_arePresent() {
        List<String> tables =
                jdbc.queryForList(
                        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
                        String.class);

        assertThat(tables)
                .contains(
                        "departments",
                        "users",
                        "roles",
                        "user_roles",
                        "user_identities",
                        "user_department_history",
                        "flyway_schema_history");
    }

    @Test
    @DisplayName(
            "Enums employment_status_enum and identity_provider_enum exist with expected values")
    void enums_haveExpectedValues() {
        List<String> employmentStatuses =
                jdbc.queryForList(
                        "SELECT unnest(enum_range(NULL::employment_status_enum))::text",
                        String.class);
        assertThat(employmentStatuses)
                .containsExactlyInAnyOrder("active", "on_leave", "terminated");

        List<String> providers =
                jdbc.queryForList(
                        "SELECT unnest(enum_range(NULL::identity_provider_enum))::text",
                        String.class);
        assertThat(providers).containsExactlyInAnyOrder("google", "azure_ad", "okta", "local");
    }

    @Test
    @DisplayName("Seed inserts the four canonical roles")
    void roles_areSeeded() {
        Set<String> names = Set.copyOf(jdbc.queryForList("SELECT name FROM roles", String.class));

        assertThat(names).containsExactlyInAnyOrder("employee", "manager", "hr", "admin");
    }

    @Test
    @DisplayName("Flyway recorded V1 as applied")
    void flyway_recordedV1() {
        Integer success =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM flyway_schema_history "
                                + "WHERE version = '1' AND success = true",
                        Integer.class);
        assertThat(success).isEqualTo(1);
    }

    @Test
    @DisplayName("departments tree accepts a child row referencing a parent via parent_id")
    void departments_treeStructure() {
        String parentId = UUID.randomUUID().toString();
        String childId = UUID.randomUUID().toString();

        jdbc.update("INSERT INTO departments (id, name) VALUES (?::uuid, 'Root')", parentId);
        jdbc.update(
                "INSERT INTO departments (id, name, parent_id) VALUES (?::uuid, 'Child', ?::uuid)",
                childId,
                parentId);

        String resolvedParent =
                jdbc.queryForObject(
                        "SELECT parent_id::text FROM departments WHERE id = ?::uuid",
                        String.class,
                        childId);
        assertThat(resolvedParent).isEqualTo(parentId);
    }

    @Test
    @DisplayName("user_department_history rejects two open memberships for the same user")
    void userDepartmentHistory_partialUniqueIndex() {
        String userId = UUID.randomUUID().toString();
        String deptA = UUID.randomUUID().toString();
        String deptB = UUID.randomUUID().toString();
        String employeeId = "E-" + userId.substring(0, 8);
        String email = employeeId + "@example.com";

        jdbc.update("INSERT INTO departments (id, name) VALUES (?::uuid, 'Dept A')", deptA);
        jdbc.update("INSERT INTO departments (id, name) VALUES (?::uuid, 'Dept B')", deptB);
        jdbc.update(
                "INSERT INTO users (id, employee_id, email, full_name, "
                        + "department_id, job_title, job_category) VALUES "
                        + "(?::uuid, ?, ?, 'Open User', ?::uuid, 'Eng', 'engineering')",
                userId,
                employeeId,
                email,
                deptA);

        // First open membership inserts cleanly.
        jdbc.update(
                "INSERT INTO user_department_history "
                        + "(user_id, department_id, effective_from, recorded_by) "
                        + "VALUES (?::uuid, ?::uuid, now(), ?::uuid)",
                userId,
                deptA,
                userId);

        // Second open membership (effective_to IS NULL) must violate the partial unique index.
        assertThatThrownByInserting(
                () ->
                        jdbc.update(
                                "INSERT INTO user_department_history "
                                        + "(user_id, department_id, effective_from, recorded_by) "
                                        + "VALUES (?::uuid, ?::uuid, now(), ?::uuid)",
                                userId,
                                deptB,
                                userId));
    }

    private static void assertThatThrownByInserting(Runnable insert) {
        try {
            insert.run();
        } catch (Exception expected) {
            return;
        }
        throw new AssertionError("expected unique-constraint violation, none thrown");
    }
}

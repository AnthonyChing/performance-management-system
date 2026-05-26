package com.pms.seed;

import com.pms.config.TestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Validates db/seed/R__dev_seed.sql directly against the test container.
 * Each test truncates the org tables via CASCADE (which also clears performance tables),
 * then runs the dev seed and the test seed to restore a clean state.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class DevSeedTest {

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void setUp() throws IOException {
        jdbc.execute("TRUNCATE TABLE departments CASCADE");
        runDevSeed();
        runTestSeed();
    }

    @Test
    @DisplayName("seed builds the expected departments tree")
    void seeds_departments() {
        assertEquals(6, count("departments"));

        String parentOfBackend = jdbc.queryForObject(
                "SELECT p.name FROM departments c JOIN departments p ON p.id = c.parent_id "
                        + "WHERE c.name = 'Backend'",
                String.class);
        assertEquals("Engineering", parentOfBackend);
    }

    @Test
    @DisplayName("seed creates users with manager links, roles, and open department history")
    void seeds_users() {
        assertEquals(7, count("users"));

        String managerOfEric = jdbc.queryForObject(
                "SELECT m.full_name FROM users u JOIN users m ON m.id = u.manager_id "
                        + "WHERE u.email = 'eric.lin@acme.test'",
                String.class);
        assertEquals("Mandy Ma", managerOfEric);

        Integer helenHrRole = jdbc.queryForObject(
                "SELECT count(*) FROM user_roles ur "
                        + "JOIN users u ON u.id = ur.user_id JOIN roles r ON r.id = ur.role_id "
                        + "WHERE u.email = 'helen.ho@acme.test' AND r.name = 'hr'",
                Integer.class);
        assertEquals(1, helenHrRole);

        Integer openHistoryRows = jdbc.queryForObject(
                "SELECT count(*) FROM user_department_history WHERE effective_to IS NULL",
                Integer.class);
        assertEquals(4, openHistoryRows);
    }

    @Test
    @DisplayName("re-running the seed is idempotent (no duplicates, no errors)")
    void seed_isIdempotent() throws IOException {
        runDevSeed();

        assertEquals(6, count("departments"));
        assertEquals(7, count("users"));
        assertEquals(7, count("user_roles"));
        assertEquals(4, jdbc.queryForObject(
                "SELECT count(*) FROM user_department_history WHERE effective_to IS NULL",
                Integer.class));
    }

    private int count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class);
    }

    private void runDevSeed() throws IOException {
        String sql = new String(
                new ClassPathResource("db/seed/R__dev_seed.sql").getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);
        jdbc.execute(sql);
    }

    private void runTestSeed() throws IOException {
        String sql = new String(
                new ClassPathResource("db/test-seed/R__test_seed.sql").getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);
        jdbc.execute(sql);
    }
}

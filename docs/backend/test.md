# Testing Guide

This document describes the testing framework, test structure, and commands for the backend of the Performance Management System.

## Version Pinning Summary

| Item | Pinned Version | Where |
|------|---------------|-------|
| Testcontainers | `1.20.4` | `pom.xml` `<testcontainers.version>` |
| Spring Boot (includes JUnit 5, Mockito, REST Assured) | `3.3.0` | `pom.xml` `<parent>` |
| docker-java (transitive, pulled by Testcontainers) | `3.4.0` | Testcontainers 1.20.4 BOM |
| Docker API version (injected into test JVM) | `1.41` | `pom.xml` Surefire `<api.version>` |
| Docker Engine (local dev) | ≥ 27.x (not pinned) | — see note below |
| Docker Engine (CI) | recommended to pin | CI workflow file |

### Docker Engine version

The Docker daemon version is **not pinned** in `pom.xml` because Maven has no control over the host's Docker installation. This is not a problem as long as:

- Docker Engine ≥ 27.x is installed — all versions in that range support API ≥ 1.40.
- The `api.version=1.41` system property set in Surefire tells Testcontainers to use API 1.41 instead of its shaded default of 1.32, satisfying Docker's minimum requirement.

**Why is there a minimum requirement?** Testcontainers 1.20.x bundles a shaded copy of docker-java whose default Docker API version is 1.32. Docker Engine 27+ dropped support for API versions below 1.40 and will return HTTP 400 for any request using an older version. The `api.version=1.41` fix in `pom.xml` resolves this incompatibility.

**For CI environments**, pin the Docker Engine version in the workflow file to guarantee reproducibility:

```yaml
# GitHub Actions example
- name: Set up Docker
  uses: docker/setup-docker-action@v3
  with:
    version: "27.5.1"   # any 27.x or 28.x works; avoid <27 and check release notes for >29
```

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| JUnit 5 (Jupiter) | via Spring Boot 3.3.0 | Test runner & assertions |
| Spring Boot Test | 3.3.0 | Spring context loading, `@SpringBootTest` |
| Testcontainers | 1.20.4 | Spin up real PostgreSQL in Docker for integration tests |
| REST Assured | via Spring Boot BOM | HTTP-level API assertions |
| Mockito | via Spring Boot BOM | Mocking (available, not yet used) |
| Maven Surefire | 3.2.5 | Test execution & reporting |

---

## Test Structure

```
backend/src/test/
├── java/com/pms/
│   ├── DockerDiagnosticTest.java          # Sanity check: verifies Docker + Testcontainers work
│   └── controller/
│       └── HealthControllerTest.java      # Integration tests for /api/v1/health
└── resources/
    ├── application-test.properties        # Test profile config (overrides main config)
    └── logback-test.xml                   # Test-only log config (Testcontainers debug output)
```

### `TestcontainersConfig.java` (shared config)

Located at `src/test/java/com/pms/config/TestcontainersConfig.java`.

Declares a single shared `PostgreSQLContainer` (postgres:15-alpine) annotated with `@ServiceConnection`. Spring Boot automatically wires this container's JDBC URL, username, and password into the datasource — no manual property overrides required.

The container uses `.withReuse(true)` so it persists across test classes in the same JVM run, keeping test suite startup fast.

```java
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
                .withDatabaseName("pms_test")
                .withUsername("pms_user")
                .withPassword("pms_pass")
                .withReuse(true);
    }
}
```

---

## Test Files

### `DockerDiagnosticTest`

A lightweight diagnostic class with **no Spring context**. Runs raw Testcontainers checks.

| Test | Description |
|------|-------------|
| `dockerIsAvailable` | Verifies that Docker daemon is reachable from the test JVM |
| `postgresContainerCanStart` | Starts a PostgreSQL 15 container and confirms it is running |

Use this to isolate Docker-level issues from Spring configuration issues. If these tests pass but `HealthControllerTest` fails, the problem is in Spring context setup, not Docker.

### `HealthControllerTest`

Full integration tests for `GET /api/v1/health`. Boots the entire Spring application with a real PostgreSQL container via `@Import(TestcontainersConfig.class)`.

| Test | What it checks |
|------|----------------|
| `health_returnsOkWithExpectedFields` | Status 200, body fields: `status`, `service`, `version`, `timestamp`, `instance` |
| `health_versionFollowsSemVer` | `version` field matches `\d+\.\d+\.\d+.*` (e.g. `1.0.0`) |
| `health_returnsJsonContentType` | `Content-Type: application/json` |
| `health_respondsWithinAcceptableTime` | Response time under 500 ms |

The `expectedVersion` field is injected from `application.properties` and should match the version declared in `pom.xml`.

---

## Test Configuration

### `application-test.properties`

Activated by `@ActiveProfiles("test")`. Key settings:

```properties
# Recreate schema on every test run
spring.jpa.hibernate.ddl-auto=create-drop

# SQL logging (useful during development)
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

The datasource URL/credentials are **not** set here — they are injected automatically by `@ServiceConnection` from the Testcontainers PostgreSQL container.

### Maven Surefire Config (`pom.xml`)

Testcontainers requires Docker API version ≥ 1.40 (enforced by Docker Engine 27+). The Surefire plugin is configured to inject the correct settings into the forked test JVM:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <environmentVariables>
            <DOCKER_HOST>unix:///var/run/docker.sock</DOCKER_HOST>
            <DOCKER_API_VERSION>1.41</DOCKER_API_VERSION>
            <TESTCONTAINERS_DOCKER_CLIENT_STRATEGY>
                org.testcontainers.dockerclient.UnixSocketClientProviderStrategy
            </TESTCONTAINERS_DOCKER_CLIENT_STRATEGY>
        </environmentVariables>
        <systemPropertyVariables>
            <testcontainers.docker.host>unix:///var/run/docker.sock</testcontainers.docker.host>
            <api.version>1.41</api.version>
        </systemPropertyVariables>
    </configuration>
</plugin>
```

> **Why `api.version=1.41`?**
> Testcontainers 1.20.x bundles a shaded copy of docker-java that defaults to Docker API v1.32. Docker Engine 27+ dropped support for API versions below 1.40. Setting `api.version=1.41` as a JVM system property forces the shaded `DefaultDockerClientConfig` to use a compatible API version.

---

## Prerequisites

Before running tests, make sure:

1. **Docker is running**
   ```bash
   docker info
   ```

2. **Current user is in the `docker` group** (no `sudo` needed)
   ```bash
   groups   # should list 'docker'
   ```

3. **PostgreSQL image is available** (pulled automatically on first run, or pre-pull)
   ```bash
   docker pull postgres:15-alpine
   ```

---

## Commands

### Run all tests

```bash
cd backend
mvn test
```

### Run all tests with explicit test profile

```bash
mvn test -Dspring.profiles.active=test
```

### Run a specific test class

```bash
# Run only HealthControllerTest
mvn test -Dtest=HealthControllerTest

# Run only DockerDiagnosticTest
mvn test -Dtest=DockerDiagnosticTest
```

### Run a specific test method

```bash
mvn test -Dtest=HealthControllerTest#health_returnsOkWithExpectedFields
```

### Skip tests (build only)

```bash
mvn package -DskipTests
```

### Run tests and generate report

```bash
mvn test surefire-report:report
# Report generated at: backend/target/site/surefire-report.html
```

### Clean and run tests

```bash
mvn clean test
```

---

## Test Lifecycle

When `mvn test` runs, the following happens in order:

1. Maven compiles `src/main` and `src/test`
2. Surefire forks a JVM with the configured env vars and system properties
3. **`DockerDiagnosticTest`** runs first (no Spring context needed):
   - Connects to Docker via Unix socket
   - Starts a throwaway PostgreSQL container to verify Testcontainers works
4. **`HealthControllerTest`** runs:
   - Spring application context boots
   - `TestcontainersConfig` starts a `postgres:15-alpine` container
   - `@ServiceConnection` wires the container's JDBC URL into the datasource
   - Hibernate creates the schema (`create-drop`)
   - REST Assured sends real HTTP requests to the running server
   - Container is reused across test classes (`.withReuse(true)`)
5. JVM exits; Testcontainers cleans up containers (unless reuse is active)

---

## Troubleshooting

### `Docker must be available for Testcontainers to work`

Docker daemon is not running or not accessible.

```bash
# Check Docker service
systemctl status docker

# Start if stopped
sudo systemctl start docker

# Verify socket permissions
ls -la /var/run/docker.sock   # should be srw-rw---- with group 'docker'
```

### `client version 1.32 is too old. Minimum supported API version is 1.40`

The Docker API version mismatch between Testcontainers' bundled docker-java (defaults to 1.32) and Docker Engine 27+. This is already fixed in `pom.xml` via `<api.version>1.41</api.version>`. If you see this error, verify the Surefire config in `pom.xml` is intact.

### `Could not find a valid Docker environment`

Check that the `~/.testcontainers.properties` cache is not corrupted:

```bash
cat ~/.testcontainers.properties
# Expected content:
# docker.host=unix:///var/run/docker.sock
# testcontainers.reuse.enable=true
```

If the file contains a bad strategy entry, delete it and let Testcontainers re-detect:

```bash
rm ~/.testcontainers.properties
```

### Tests pass locally but fail in CI

Ensure the CI runner has Docker available and the `docker` socket is accessible. Add the equivalent of the Surefire `environmentVariables` block to the CI environment, or run tests inside a Docker-in-Docker (DinD) setup.

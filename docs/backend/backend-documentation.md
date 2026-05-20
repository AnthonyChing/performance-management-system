# Performance Management System - Backend

Spring Boot backend for the Performance Management System.

## Current backend status

The backend is currently an initial server skeleton with these completed parts:

1. Spring Boot app bootstrap (`PerformanceManagementSystemApplication`)
2. Health check controller (`HealthController`)
3. Dockerized build/runtime flow (multi-stage Dockerfile)
4. Docker Compose single-instance startup (`backend` service)
5. Database baseline config (H2 for development, MySQL config placeholders)

## Tech stack

| Area | Current choice |
| --- | --- |
| Language | Java 21 |
| Framework | Spring Boot 3.3.0 |
| Build | Maven |
| Web | spring-boot-starter-web |
| Data | spring-boot-starter-data-jpa |
| Dev DB | H2 (in-memory) |
| Prod DB driver | MySQL Connector/J |
| Container | Docker + Docker Compose |

## Project structure

```text
backend/
├── Dockerfile
├── pom.xml
├── .env.example
└── src/main/
    ├── java/com/pms/
    │   ├── PerformanceManagementSystemApplication.java
    │   └── controller/HealthController.java
    └── resources/application.properties
```

## Implemented API endpoints

### `GET /api/v1/health`

Returns service health information:

```json
{
  "status": "UP",
  "timestamp": "2026-04-29T09:00:00",
  "service": "Performance Management System",
  "version": "1.0.0",
  "instance": "container-hostname"
}
```

## Configuration notes

Main config file: `src/main/resources/application.properties`

Current behavior:

1. Runs on `SERVER_PORT` (default `8080`)
2. Context path is configurable via `CONTEXT_PATH`
3. Uses H2 in-memory DB by default (`jdbc:h2:mem:pmsdb`)
4. Includes commented MySQL connection template
5. Includes Hikari pool settings and JSON serialization settings
6. Includes management endpoint settings for future actuator expansion

## How to run

### Option A: Docker Compose (recommended)

From repository root:

```bash
docker compose up --build -d backend
```

Access:

1. API base: `http://localhost:8080`
2. Health: `http://localhost:8080/api/v1/health`

Stop:

```bash
docker compose down
```

### Option B: Local run with Maven in Docker

```bash
cd backend
docker run --rm -p 8080:8080 -v "$PWD":/app -w /app maven:3.9-eclipse-temurin-21 mvn spring-boot:run
```

### Option C: Local run with installed Maven

```bash
cd backend
mvn spring-boot:run
```

## Environment variables

Reference file: `.env.example`

| Variable | Purpose | Default |
| --- | --- | --- |
| `SERVER_PORT` | Spring server port | `8080` |
| `CONTEXT_PATH` | Servlet context path | `/` |
| `JAVA_OPTS` | JVM memory/runtime options | `-Xmx512m -Xms256m` |
| `DB_HOST` | MySQL host (when enabled) | `localhost` |
| `DB_PORT` | MySQL port (when enabled) | `3306` |
| `DB_NAME` | MySQL DB name (when enabled) | `pms` |
| `DB_USER` | MySQL user (when enabled) | `root` |
| `DB_PASSWORD` | MySQL password (when enabled) | `password` |

## Notes about HA setup

`docker-compose.yml` currently runs a single backend service for simplicity.

HA-related examples (`backend-2`, `nginx`) are still kept as commented templates in compose and can be re-enabled later when needed.

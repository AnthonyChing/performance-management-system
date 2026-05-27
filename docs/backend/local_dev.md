# Local backend dev (skipping Google sign-in)

`POST /api/v1/auth/google` is the only endpoint that calls Google. Every other
endpoint just verifies the JWT signature, so for local development you can mint
a JWT yourself and skip Google entirely.

## 1. Start Postgres

```bash
docker compose up -d postgres
```

This brings up Postgres 17 on `localhost:5432` with `db=pms / user=pms /
password=pms` (see `docker-compose.yml`).

## 2. Start the backend in `dev` profile

The dev seed (`src/main/resources/db/seed/R__dev_seed.sql`) only loads when
profile = `dev`. Without it the DB is empty and every call returns
`USER_NOT_FOUND`.

```bash
cd backend
DB_HOST=localhost DB_PORT=5432 DB_NAME=pms DB_USER=pms DB_PASSWORD=pms \
GRAFANA_OTLP_URL=http://localhost:4318 \
SPRING_PROFILES_ACTIVE=dev \
  mvn spring-boot:run
```

Notes:
- `GRAFANA_OTLP_URL` must be set to *something* that starts with `http://` —
  blank fails OTLP exporter validation at startup. The URL doesn't need to
  resolve; traces will just fail to send.
- Health check: `curl http://localhost:8080/api/v1/health` → `200`.

## 3. Mint a JWT

JWT secret defaults to the placeholder in `application.properties` if
`JWT_SECRET` is unset. Sign HS256 with that secret and you're in.

```bash
python3 << 'PYEOF'
import base64, hmac, hashlib, json, time

secret = "change-this-secret-to-a-long-random-base64-string-at-least-256-bits"

def b64url(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

def mint(sub, roles, ttl_sec=86400):
    now = int(time.time())
    header = {"alg": "HS256"}
    payload = {"sub": sub, "roles": roles, "iat": now, "exp": now + ttl_sec}
    h = b64url(json.dumps(header, separators=(",", ":")).encode())
    p = b64url(json.dumps(payload, separators=(",", ":")).encode())
    sig = b64url(hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
    return f"{h}.{p}.{sig}"

# Pick one — see "Seeded users" below
print(mint("00000000-0000-0000-0000-0000000000c1", ["employee"]))
PYEOF
```

## 4. Call any endpoint

```bash
TOKEN="<paste from step 3>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/me/profile
```

A `401` means the JWT failed to verify (wrong secret, expired, malformed).
A `200/4xx with a body` means auth passed — handler errors (404/403/409) are
business logic, not auth.

## Seeded users (dev profile)

| Role     | UUID                                       | Email               |
| -------- | ------------------------------------------ | ------------------- |
| HR       | `00000000-0000-0000-0000-0000000000a1`     | helen.ho@acme.test  |
| Manager  | `00000000-0000-0000-0000-0000000000b1`     | mandy.ma@acme.test  |
| Employee | `00000000-0000-0000-0000-0000000000c1`     | eric.lin@acme.test  |
| Employee | `00000000-0000-0000-0000-0000000000c2`     | (see dev seed)      |

Roles claim values: `employee`, `manager`, `hr`, `admin`.

## Swagger UI

`http://localhost:8080/swagger-ui/index.html` — click "Authorize", paste
`Bearer <token>` (or just the raw token depending on the spec), then try
endpoints.

## Troubleshooting

- **`USER_NOT_FOUND` from a valid token** → profile is not `dev`; dev seed
  didn't run. Set `SPRING_PROFILES_ACTIVE=dev` and restart.
- **Startup fails on `OtlpHttpSpanExporter` / `Invalid endpoint`** →
  `GRAFANA_OTLP_URL` is blank. Set it to a placeholder URL (see step 2).
- **`401` on every call** → JWT signature mismatch. Check `JWT_SECRET` env var
  vs the one used to mint the token; if you didn't set the env, the default in
  `application.properties` applies.
- **Port 5432 already taken** → a leftover Testcontainers postgres may be
  running on a random port. Run `docker ps` and stop it, or change the
  compose port mapping.

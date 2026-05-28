# Local backend dev (skipping Google sign-in)

`POST /api/v1/auth/google` is the only endpoint that calls Google. Every other
endpoint just verifies the JWT signature, so for local development you can mint
a JWT yourself and skip Google entirely.

## 1. Set up `.env` (one-time)

Copy the template and fill in a local JWT secret:

```bash
cp .env.example .env
# then edit .env and set JWT_SECRET to any random string >= 32 bytes
```

`.env` is git-ignored. Don't commit real secrets.

## 2. Start Postgres

```bash
docker compose up -d postgres
```

Postgres 17 on `localhost:5432`, `db=pms / user=pms / password=pms`.

## 3. Start the backend

Pick **A** (development) or **B** (full stack). **Both read `JWT_SECRET` from
the same `.env`**, so a token minted in step 4 (which also reads `.env`) always
matches whichever path you ran. The one rule: never hand-type the secret —
always let `.env` be the single source of truth.

### A. `mvn spring-boot:run` — for active development (recommended)

Hot reload: code changes recompile and reload in ~5 s without restarting the
whole app. Required when you're editing code.

```bash
cd backend
set -a; source ../.env; set +a          # load JWT_SECRET etc. into the env
DB_HOST=localhost DB_PORT=5432 DB_NAME=pms DB_USER=pms DB_PASSWORD=pms \
  mvn spring-boot:run
```

The `set -a; source ../.env; set +a` line is the critical bit: it exports every
var in `.env` (including `JWT_SECRET`) so Spring picks them up. **Skip it and
Spring silently falls back to the placeholder secret in
`application.properties`** — then your token won't match and every call returns
`401`. (Don't use `export $(grep ... | xargs)`; it breaks on values with
special characters.)

Notes:
- `DB_HOST=localhost` because the JVM runs on the host, not in compose.
- `SPRING_PROFILES_ACTIVE=dev` (from `.env`) triggers
  `src/main/resources/db/seed/R__dev_seed.sql` so the DB isn't empty.
- `GRAFANA_OTLP_URL` must start with `http://` (blank fails OTLP validation at
  startup); `.env.example` already sets a placeholder.

### B. `docker compose up backend` — for running the full stack

Closer to production. No hot reload; rebuild needed after code changes:
`docker compose up -d --build backend`.

```bash
docker compose up -d backend
```

`.env` is auto-loaded by compose; `SPRING_PROFILES_ACTIVE`, `GRAFANA_OTLP_URL`,
and `JWT_SECRET` flow into the container via `docker-compose.yml`. If
`JWT_SECRET` is missing, compose refuses to start the service.

Health check (either path): `curl http://localhost:8080/api/v1/health` → `200`.

## 4. Mint a JWT

The script below reads `JWT_SECRET` straight from `.env` — the same value both
startup paths use — so the token always matches. Run it from the project root:

```bash
JWT_SECRET=$(grep '^JWT_SECRET=' .env | cut -d= -f2-) python3 << 'PYEOF'
import base64, hmac, hashlib, json, os, time

secret = os.environ["JWT_SECRET"]

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

> If you ran path A from `backend/`, the `.env` is at `../.env` — either `cd`
> back to the project root before minting, or change `.env` to `../.env` in the
> command above.

## 5. Call any endpoint

```bash
TOKEN="<paste from step 4>"
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

- **`docker compose up backend` errors with `JWT_SECRET must be set`** →
  `.env` is missing or `JWT_SECRET` is blank. Run step 1.
- **`USER_NOT_FOUND` from a valid token** → profile is not `dev`; dev seed
  didn't run. Confirm `SPRING_PROFILES_ACTIVE=dev` in `.env` (path A) or
  exported (path B) and restart.
- **Startup fails on `OtlpHttpSpanExporter` / `Invalid endpoint`** →
  `GRAFANA_OTLP_URL` is blank. `.env.example` sets a placeholder; make sure
  it's in your `.env`.
- **`401` on every call (token is present in the header)** → JWT signature
  mismatch: the backend and the mint script used different secrets. Almost
  always path A was started **without** `set -a; source ../.env; set +a`, so
  Spring used the placeholder secret while the mint script used `.env`. Restart
  the backend with the source line, or confirm both sides read the same `.env`.
  Quick check — this prints which secret signed a token:

  ```bash
  python3 - "$TOKEN" "$(grep '^JWT_SECRET=' .env | cut -d= -f2-)" << 'PYEOF'
  import base64, hmac, hashlib, sys
  token, env_secret = sys.argv[1], sys.argv[2]
  h, p, sig = token.split(".")
  b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=").decode()
  placeholder = "change-this-secret-to-a-long-random-base64-string-at-least-256-bits"
  for name, s in {".env": env_secret, "placeholder": placeholder}.items():
      ok = b64(hmac.new(s.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()) == sig
      print(f"{'MATCH' if ok else 'no   '}  {name}")
  PYEOF
  ```
- **Port 5432 already taken** → a leftover Testcontainers postgres may be
  running on a random port. Run `docker ps`, stop it, or change the compose
  port mapping.

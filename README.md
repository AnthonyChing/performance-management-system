# Performance Management System (績效管理系統)
This is the repository of the final project of Cloud Native Application Development (雲原生應用程式開發) of team 11 at National Taiwan Univeristy (NTU).

## How to set up frontend environment

### Development

*For example*:

Use Node.js v25.4.0.

After cloning the repository, run the following commands to setup the development environment:
```
cd frontend
npm install
```

Run `npm run dev` to start vite dev server.

### Production

In a production environment, the frontend is built using Vite and deployed to **Google Firebase Hosting**.

#### Automated Deployment (Recommended)
Deployments are fully automated via GitHub Actions:
1. Production deployment is triggered when a semantic version tag (e.g., `v1.0.0`) is pushed to the repository.
2. The GitHub workflow [frontend.yml](./.github/workflows/frontend.yml) builds the frontend using the production API URL (`PROD_API_URL`) and deploys the output to the `live` channel on Firebase.
3. Refer to the [CI/CD Strategy](./docs/cicd.md) for more details.

#### Local Production Build
To build and test the production-ready assets locally:
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Build the application:
   ```bash
   npm run build
   ```
3. Preview the production build locally:
   ```bash
   npm run preview
   ```
   This will start a local web server serving the static files from the `dist` directory.

## How to set up backend environment

### Development

Backend is now Spring Boot (Java). Run from repository root:

```bash
docker compose up --build -d backend
```

Health check:

```bash
curl http://localhost:8080/api/v1/health
```

Stop backend:

```bash
docker compose down
```

### Production

In a production environment, the backend is a containerized Spring Boot application deployed to **Google Cloud Run**.

#### Automated Deployment (Recommended)
Deployments are fully automated via GitHub Actions:
1. Pushing a version tag (e.g., `v1.0.0`) triggers the deployment pipeline.
2. The GitHub workflow [backend.yml](./.github/workflows/backend.yml) builds the Docker image using the `Dockerfile` at [backend/Dockerfile](./backend/Dockerfile) and pushes it to GCP Artifact Registry.
3. The image is then deployed to Google Cloud Run as the `backend-prod` service.
4. Refer to the [CI/CD Strategy](./docs/cicd.md) for more details.

#### Local Production Container Run
To run the production container locally for testing:
1. Ensure your `.env` file at the root is configured (copy from [env.example](./.env.example)).
2. Build and start the container:
   ```bash
   docker compose up --build -d backend
   ```
3. To run with a production profile (disabling dev-only endpoints and DB seeding):
   ```bash
   SPRING_PROFILES_ACTIVE=prod docker compose up --build -d backend
   ```

## GitHub rules

The `main` branch is protected. All commits must be made to another branch and submitted via a pull request before they can be merged. Force pushes are also blocked.

Branches should be created to focus on a specific functionality or purpose. Avoid creating long-lived branches.

### After work is done on the branch, either:
- Create PR, squash merge the task branch into main once approved, and then delete the task branch. Use this when you want to share changes with others but you're not completely done with what you were doing yet. This will only add one commit in the history in the `main` branch.
- Create PR, merge normally once approved, and then delete the task branch. Use this when you're totally done with what you're doing. This will add all commits in your branch to the history of `main` branch.

### Branch Naming Rule

`<scope>/<type>/<short-description>`

#### Example:
- backend/feature/user-auth
- backend/fix/allocation
- infra/chore/docker-build-optimize

#### scope (where it happens)
- backend
- frontend
- fullstack (if both)
- infra / devops

#### type (what you’re doing)
- feature – new functionality
- fix – bug fixes
- chore – maintenance (deps, config)
- refactor – code changes without behavior change
- docs – documentation
- test – tests

#### short-description
- lowercase
- hyphen-separated
- concise but meaningful

## Documentation

For further documentation, please check out the [docs/](./docs/) directory.

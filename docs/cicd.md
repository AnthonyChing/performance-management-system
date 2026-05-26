# CI/CD Strategy

This document outlines the Continuous Integration (CI) and Continuous Deployment (CD) pipelines used for the Performance Management System (PMS). The workflows are decoupled into separate files to handle the frontend and backend architectures independently.

## Overview

The project relies on **GitHub Actions** for orchestration and builds, deploying exclusively to **Google Cloud Platform (GCP)**.

- **Frontend**: Built with Vite and React, hosted on **Firebase Hosting**.
- **Backend**: Containerized Spring Boot application, hosted on **Google Cloud Run**.
- **Environments**: Both frontend and backend support a **Staging** and **Production** environment mapped to branch activities and tags respectively.

## GitHub Actions Workflows

We use a modular approach with four dedicated CI/CD configuration files located in `.github/workflows/`.

---

### 1. Backend CI (`backend-ci.yml`)
**Triggers**: Pull Requests targeting the `main` branch. 
**Goal**: Run quality checks and tests before code is merged.

- **Stack**: Java 21, Maven 
- **Checks Performed**:
  - Code Formatting: Spotless (`mvn spotless:check`)
  - Code Quality: Checkstyle (`mvn checkstyle:check`)
  - Static Analysis / Bug Finding: SpotBugs (`mvn spotbugs:check`)
  - Unit Tests: (`mvn clean test`)

### 2. Backend CD (`backend-cd.yml`)
**Triggers**: Commits to `main` branch, Tags starting with `v*`, and Manual Dispatch.
**Goal**: Build the Docker container and deploy it to Google Cloud.

- **Container Registry**: GCP Artifact Registry
- **Deployment Target**: Google Cloud Run
- **Environment Strategy**:
  - **Staging**: Triggered by standard commits to `main`. Deploys the image tagged with the short `SHA` digest to a Cloud Run service named `backend-staging`.
  - **Production**: Triggered by pushing a version tag (e.g., `v1.0.0`). Deploys the semver-tagged image to a Cloud Run service named `backend-prod`.
- **Notifications**: Posts a status update (Success / Failure with deployment URL) directly to a Discord channel via Webhook.

### 3. Frontend CI (`frontend-ci.yml`)
**Triggers**: Pull Requests targeting the `main` branch.
**Goal**: Ensure frontend code compiles and passes UI tests.

- **Stack**: Node.js 18
- **Checks Performed**:
  - Dependency Installation (`npm install`)
  - Playwright End-to-End Tests (`npm run test:e2e`)
  - Artifact Uploads for debugging Playwright reports and failures

### 4. Frontend CD (`frontend-cd.yml`)
**Triggers**: Commits to `main` branch, Tags starting with `v*`, and Manual Dispatch.
**Goal**: Build static UI files with proper Environment Variables and push to Firebase Hosting.

- **Deployment Target**: Google Firebase Hosting
- **Environment Strategy**:
  - **Vite Configuration**: We dynamically inject the `VITE_API_ORIGIN` variable before building so the frontend connects to the correct Cloud Run instance.
  - **Staging**: Triggered by commits to `main`. Connects to `STAGING_API_URL` Repository Variable and pushes to the Firebase `staging` preview channel.
  - **Production**: Triggered by version tags (e.g., `v1.0.0`). Connects to `PROD_API_URL` and pushes to the Firebase `live` production channel.

---

## Secret and Variable Management

The automated deployment processes rely on the following secrets and variables configured within the GitHub Repository:

**Secrets (`secrets.*`)**:
- `GCP_PROJECT_ID`: The target Google Cloud Project ID.
- `GCP_SA_KEY`: An authorized Service Account JSON Key used to run Docker commands and access Cloud Run.
- `FIREBASE_SERVICE_ACCOUNT_[YOUR_KEY]`: Firebase token necessary to upload web assets.
- `DISCORD_WEBHOOK_DEPLOY`: Webhook link used for backend deployment alerts.

**Variables (`vars.*`)**:
- `STAGING_API_URL`: The Cloud Run URL for the staging instance (e.g., `https://backend-staging-xxx.run.app`). 
- `PROD_API_URL`: The Cloud Run URL for the production instance (e.g., `https://backend-prod-xxx.run.app`). 

## Pushing a Production Release (Git Tags)

Since production deployments are configured to trigger on version tags (e.g., `v1.0.0`), you need to explicitly create and push a Git tag to GitHub to kick off the production CI/CD pipelines for both the frontend and backend.

1. **Create a new tag**:
   Make sure you are on the `main` branch and have pulled the latest code, then run:
   ```bash
   git tag v1.0.0
   ```
   *(Note: The tag must start with `v` as defined in the workflow files `v*` pattern).*

2. **Push the tag to GitHub**:
   To push the specific tag to the remote repository and trigger the deployments:
   ```bash
   git push origin v1.0.0
   ```

*(Alternatively, you can push all of your local, un-pushed tags at once by running `git push --tags`).*

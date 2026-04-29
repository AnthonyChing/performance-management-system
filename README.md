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

*TODO*: Add description here

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

*TODO*: Add description here

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

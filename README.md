# Warehouse App

JavaScript/TypeScript based warehouse management system scaffold.

## Structure

```text
apps/
  api/      Node.js API for web and future mobile clients
  web/      React admin interface
packages/
  shared/   Shared TypeScript types and constants
```

## First run

Install dependencies:

```bash
npm install
```

Run the API and web app:

```bash
npm run dev
```

Run PostgreSQL with Docker:

```bash
docker compose up -d postgres
```

API health endpoint:

```text
http://localhost:4000/health
```

Web app:

```text
http://localhost:5173
```

## Mobile-ready direction

The backend is API-first. Later, add an Expo app at `apps/mobile` and reuse shared types from `packages/shared`.

# BaseDocs

A minimal, self-hosted documentation app — think Confluence without the bloat. Teams can organize, write, and publish internal docs in a clean, distraction-free environment.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20PostgreSQL-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Spaces** — top-level containers for organizing docs (e.g. "Engineering", "Product")
- **Pages** — rich-text documents with nested child pages
- **Block editor** — TipTap-powered, Markdown-friendly editing experience
- **Role-based access** — Admin and Writer roles
- **Admin Console** — manage users, spaces, roles, and activity logs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Editor | TipTap (block-based rich text) |
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT + bcrypt (httpOnly cookie) |
| Deployment | Railway |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET
cp server/.env.example server/.env

# Run migrations and seed default admin
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev:full
```

- Frontend: `http://localhost:5070`
- API: `http://localhost:4000`

### Default Admin Credentials

```
Email:    admin@basedocs.local
Password: admin123
```

> Change these immediately after first login.

## Project Structure

```
src/           # React frontend
  components/  # Reusable UI components
  pages/       # Route-level views
  lib/         # API client, utilities
  hooks/       # Custom React hooks
server/        # Express API
  routes/      # Route handlers
  controllers/ # Business logic
  middleware/  # Auth + role guards
prisma/        # Schema and migrations
```

## Scripts

```bash
pnpm dev          # Frontend dev server
pnpm server       # API server
pnpm dev:full     # Both concurrently
pnpm build        # Production build
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed default admin + sample data
pnpm typecheck    # TypeScript check
```

## Roles & Permissions

| Action | Writer | Admin |
|---|---|---|
| View spaces & pages | ✅ | ✅ |
| Create/edit own pages | ✅ | ✅ |
| Edit any page | ❌ | ✅ |
| Manage spaces | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| Access `/admin` | ❌ | ✅ |

## Deployment

This project is configured for [Railway](https://railway.app). Connect your repo, add a PostgreSQL plugin, and set the following environment variables:

```
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
```

Railway will automatically run `pnpm build`, Prisma migrations, and start the server.

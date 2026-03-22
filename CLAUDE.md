# BaseDocs

A minimal, self-hosted documentation app — think Confluence without the bloat. Teams can organize, write, and publish internal docs in a clean, distraction-free environment.

## Core Concept

- **Spaces** → top-level containers (e.g., "Engineering", "Product")
- **Pages** → documents within a space, with nested child pages
- **Editor** → rich-text (block-based), Markdown-friendly
- Two roles: **Admin** and **Writer**

## Design System

Inspiration: warm, editorial, and tactile. Not cold SaaS.

- **Fonts:** `Lora` (serif) for all headings and the wordmark · `Plus Jakarta Sans` for all UI text and body
- **Palette:**
  - Background: `#f5f0e8` (warm cream) · Surface: `#fffcf5`
  - Ink: `#1c1a16` · Muted: `#8c857a`
  - Green accent: `#2d6a4f` · Terracotta: `#bc5a3c` · Amber: `#c07a0a`
  - Borders: `#ddd6c8`
- **Buttons:** Always `border-radius: 99px` (pill shape). Three variants: `btn-ink` (primary), `btn-ghost` (secondary), `btn-danger`
- **Cards:** `border-radius: 16px`, `1.5px solid var(--cream-border)`. On hover: `box-shadow: 4px 4px 0 var(--ink)` with `translate(-2px, -2px)` — the signature offset lift
- **Sidebar:** Deep warm ink `#1c1a16` background, never cold black
- **Space icons:** Emoji inside a soft colored pill (`background: <color>18` tint of the space color)
- **Modals:** `backdrop-filter: blur(3px)` overlay, `border-radius: 20px` box on cream surface
- **Toasts:** Pill-shaped, centered at bottom, slide-up animation

All CSS lives in a single `STYLES` const injected via `<style>` — do not use Tailwind utility classes for this app. Use CSS custom properties (`var(--green)` etc.) consistently.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Editor:** BlockNote or TipTap (rich-text, block-based)
- **Backend:** Node.js, Express (REST API)
- **Database:** PostgreSQL (via Prisma ORM)
- **Auth:** JWT + bcrypt (session stored in httpOnly cookie)
- **Testing:** Vitest, React Testing Library
- **Package manager:** pnpm

## Project Structure

```
src/
  components/        # Reusable UI components
  pages/             # Route-level views
    admin/           # Admin console views
  lib/               # Utilities, API client, helpers
  hooks/             # Custom React hooks
  types/             # TypeScript types
  middleware/        # Auth + role guards
server/
  routes/            # Express route handlers
  controllers/       # Business logic
  models/            # Prisma schema models
  middleware/        # Auth verification, role checks
prisma/
  schema.prisma
tests/
```

## User Roles & Permissions

### Writer
- Create, edit, and delete their own pages
- View all spaces and pages they have access to
- Cannot access Admin Console

### Admin
- Full CRUD on all pages, spaces, and users
- Access to Admin Console (`/admin`)
- Invite users, assign roles, revoke access
- Manage spaces (create, archive, delete)
- View activity logs

## Admin Console (`/admin`)

Routes and features within the admin panel:

| Route | Purpose |
|---|---|
| `/admin/users` | List, invite, edit, or deactivate users |
| `/admin/spaces` | Create, archive, delete spaces |
| `/admin/roles` | Assign/change user roles |
| `/admin/activity` | View recent edits, logins, deletions |
| `/admin/settings` | App-wide settings (site name, auth config) |

## Common Commands

```bash
pnpm dev            # Start dev server (localhost:3000)
pnpm server         # Start API server (localhost:4000)
pnpm dev:full       # Run both concurrently
pnpm build          # Production build
pnpm test           # Run tests
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm db:migrate     # Run Prisma migrations
pnpm db:seed        # Seed default admin user
```

## Development Conventions

- Named exports only (no default exports for components)
- Co-locate tests next to source files (`Button.test.tsx`)
- Prefer `async/await`; never `.then()` chains
- Zod for validation at all API boundaries
- Role checks happen in Express middleware, not controllers
- All admin routes require `requireRole('admin')` middleware

## Auth Flow

1. `POST /api/auth/login` → returns JWT in httpOnly cookie
2. All protected routes check cookie via `requireAuth` middleware
3. Admin routes additionally check `requireRole('admin')`
4. `POST /api/auth/logout` → clears cookie

## Gotchas / Known Issues

- Never instantiate Prisma client directly — use the singleton in `server/lib/db.ts`
- The editor (TipTap/BlockNote) stores content as JSON, not HTML — serialize carefully
- Admin seeding (`pnpm db:seed`) creates a default `admin@BaseDocs.local` user
- Page slugs are auto-generated from titles but must be unique per space

## Domain Terminology

- **Space:** A top-level grouping of related documentation (like a Confluence Space)
- **Page:** A single document; pages can have child pages (nested tree)
- **Block:** A unit of content in the editor (paragraph, heading, code block, etc.)
- **Admin Console:** The `/admin` dashboard, accessible only to Admin-role users

# Placements Management Tool

An internal web application for managing apprenticeship placements within a large organisation. It connects three types of users -- apprentices, apprentice managers, and placement managers -- and gives each a tailored interface for browsing placements, handling applications, and sharing feedback.

## What this project does

Apprentices in the organisation rotate through different teams on structured placements. This tool replaces what would otherwise be a manual, spreadsheet-driven process:

- **Apprentices** browse open placement listings, apply with a cover message, track the status of their applications, and leave reviews on completed placements.
- **Apprentice Managers** oversee a group of apprentices. They see a dashboard of who is placed where, approve or deny applications, and read placement reviews.
- **Placement Managers** own placement listings. They create and manage those listings, request specific apprentices, and view applications and reviews for their placements.

Every user logs in with an email and password. What they see in the sidebar and on each page is determined by their role.

## Tech stack

If you're new to web development, here is what each piece does and why it's here:

| Technology | What it is | Why we use it |
|---|---|---|
| **TypeScript** | A typed superset of JavaScript | Catches bugs at compile time instead of at runtime. Every file in this project is `.ts` or `.tsx`. |
| **React** | A UI library for building interfaces out of components | The standard for building interactive web apps. We use React 19. |
| **TanStack Start** | A full-stack React framework (similar to Next.js) | Gives us server-side rendering, file-based routing, and server functions so we can run database queries securely on the server. |
| **TanStack Router** | The routing layer inside TanStack Start | Maps URL paths like `/placements` or `/applications/abc123` to React components. Routes are defined by the file structure inside `src/routes/`. |
| **Vite** | A build tool and dev server | Compiles our TypeScript/React code and serves it locally with fast hot-reload during development. |
| **SQLite** | A file-based relational database | All our data lives in a single file (`db/placements.db`). No database server to install or configure. |
| **Drizzle ORM** | A type-safe database query builder | Lets us write database queries in TypeScript instead of raw SQL. The schema is defined once and gives us types everywhere. |
| **Better Auth** | An authentication library | Handles user registration, login, sessions, and password hashing. Integrates directly with our Drizzle schema. |
| **TailwindCSS v4** | A utility-first CSS framework | We style elements with class names like `text-sm font-bold` rather than writing separate CSS files. |
| **Zod** | A validation library | Validates data (e.g. form inputs) on both the client and server using the same schema. |
| **Lucide React** | An icon library | Provides the SVG icons used throughout the UI (dashboard, sidebar, etc.). |

## Project structure

```
├── db/                        # SQLite database file (gitignored, created on first run)
├── drizzle/                   # Auto-generated SQL migration files
├── src/
│   ├── components/
│   │   ├── sidebar.tsx        # Role-adaptive navigation sidebar
│   │   └── ui/                # Reusable UI primitives (Button, Card, Input, etc.)
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   ├── schema.ts          # All table definitions (the single source of truth for DB structure)
│   │   └── seed.ts            # Script to populate the DB with test data
│   ├── lib/
│   │   ├── auth.ts            # Better Auth server-side configuration
│   │   ├── auth-client.ts     # Better Auth client-side hooks (signIn, signUp, signOut, useSession)
│   │   ├── auth-server.ts     # Server functions for checking session in route loaders
│   │   └── utils.ts           # Utility functions (cn for merging Tailwind classes)
│   ├── routes/
│   │   ├── __root.tsx         # HTML shell, <head>, CSS import -- wraps every page
│   │   ├── index.tsx          # "/" -- redirects to /dashboard or /login
│   │   ├── login.tsx          # Login form
│   │   ├── register.tsx       # Registration form with role selection
│   │   ├── _authed.tsx        # Layout for all authenticated pages (session guard + sidebar)
│   │   ├── _authed/
│   │   │   ├── dashboard.tsx          # Role-specific dashboard
│   │   │   ├── profile.tsx            # View/edit own profile
│   │   │   ├── placements/            # Browse, view detail, create placements
│   │   │   ├── applications/          # List and review applications
│   │   │   ├── reviews/               # Browse and write reviews
│   │   │   ├── apprentices/           # Browse and view apprentice profiles
│   │   │   ├── managers/              # Placement manager directory
│   │   │   └── requests/              # Apprentice requests
│   │   └── api/auth/$.ts     # Better Auth API catch-all route
│   ├── server/                # Server-side data-fetching functions, one file per domain
│   │   ├── dashboard.ts
│   │   ├── placements.ts
│   │   ├── applications.ts
│   │   ├── reviews.ts
│   │   ├── apprentices.ts
│   │   ├── managers.ts
│   │   └── requests.ts
│   ├── styles/app.css         # Global styles and Tailwind theme tokens
│   ├── router.tsx             # Router instance creation
│   └── routeTree.gen.ts       # Auto-generated file (do not edit) -- maps files to routes
├── .env                       # Environment variables (DB path, auth secret)
├── drizzle.config.ts          # Drizzle Kit config (points to schema and DB)
├── vite.config.ts             # Vite/TanStack Start/Tailwind plugin config
├── tsconfig.json              # TypeScript compiler settings
└── package.json               # Dependencies and scripts
```

### How routing works

TanStack Router uses **file-based routing**. The file tree inside `src/routes/` maps directly to URL paths:

| File | URL | Purpose |
|---|---|---|
| `routes/login.tsx` | `/login` | Login page |
| `routes/_authed/dashboard.tsx` | `/dashboard` | Dashboard (requires login) |
| `routes/_authed/placements/index.tsx` | `/placements` | Placement listing |
| `routes/_authed/placements/$placementId.tsx` | `/placements/abc123` | Single placement detail (dynamic segment) |
| `routes/_authed/placements/new.tsx` | `/placements/new` | Create a new placement |

Files prefixed with `_` (like `_authed.tsx`) are **layout routes** -- they don't create a URL segment but wrap child routes. The `_authed` layout checks for a valid session before rendering anything inside it.

The file `routeTree.gen.ts` is **auto-generated** by TanStack Router's Vite plugin every time the dev server starts or a route file is added/removed. Do not edit it by hand.

### How data flows

1. A route's `loader` function runs on the server before the page renders.
2. The loader calls a **server function** (in `src/server/`) which uses Drizzle ORM to query SQLite.
3. The query results are returned to the route component as typed data.
4. Write operations (creating a placement, approving an application) also go through server functions, which are invoked from event handlers in components.

```
Browser  ──loader()──>  Server Function  ──Drizzle query──>  SQLite DB
         <──typed data──                 <──rows──────────
```

### How authentication works

- **Better Auth** manages user accounts, password hashing, and sessions.
- When a user logs in, Better Auth sets an HTTP-only session cookie.
- The `_authed.tsx` layout route calls `getSession()` (a server function) in its `beforeLoad` hook. If there's no valid session, it redirects to `/login`.
- The session object (containing `user.id`, `user.name`, `user.role`) is passed down to all child routes via `Route.useRouteContext()`.
- Role checks happen inside each route's `beforeLoad` or inside component logic (e.g. only placement managers can see the "New Placement" button).

### How the database schema is organised

All tables are defined in `src/db/schema.ts`. The key tables and their relationships:

- **user** -- Every person in the system. Has a `role` field (`apprentice`, `apprentice_manager`, `placement_manager`).
- **apprentice_profile** -- Extended profile info for apprentices (skills, bio, department). One-to-one with user.
- **placement** -- A placement listing created by a placement manager.
- **application** -- An apprentice applying to a placement. Status flows: `pending` -> `approved` / `denied`.
- **review** -- An apprentice reviewing a completed placement (1-5 stars + text).
- **manager_assignment** -- Links an apprentice manager to the apprentices they oversee.
- **apprentice_request** -- A placement manager requesting apprentices for a placement.
- **session**, **account**, **verification** -- Managed by Better Auth for authentication.

## Getting started

### Prerequisites

- **Node.js 22+** (check with `node --version`)
- **pnpm** package manager (install with `npm install -g pnpm`)

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Push the database schema to create the SQLite file
pnpm db:push

# 3. Seed the database with test users and sample data
pnpm db:seed

# 4. Start the development server
pnpm dev
```

The app will be available at **http://localhost:3000**.

### Test accounts

All seeded accounts use the password **`password123`**.

| Email | Role |
|---|---|
| alice@example.com | Apprentice |
| bob@example.com | Apprentice |
| charlie@example.com | Apprentice |
| diana@example.com | Apprentice Manager |
| edward@example.com | Placement Manager |
| fiona@example.com | Placement Manager |

Log in with different accounts to see how the UI adapts to each role.

## Available scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the dev server with hot reload on port 3000 |
| `pnpm build` | Builds the app for production |
| `pnpm start` | Previews the production build |
| `pnpm db:generate` | Generates a SQL migration from schema changes |
| `pnpm db:push` | Pushes the current schema directly to the database (dev shortcut) |
| `pnpm db:seed` | Populates the database with test data (clears existing data first) |
| `pnpm db:studio` | Opens Drizzle Studio, a visual database browser |

## Common tasks

### Adding a new page

1. Create a new `.tsx` file inside `src/routes/_authed/`. The file path becomes the URL.
2. Export a `Route` using `createFileRoute`. Define a `loader` if the page needs data, and a `component` for the UI.
3. If the page needs to fetch data, create or extend a server function in `src/server/`.
4. Save the file -- the dev server will regenerate `routeTree.gen.ts` automatically.

### Changing the database schema

1. Edit `src/db/schema.ts`.
2. Run `pnpm db:generate` to create a migration, then `pnpm db:push` to apply it.
3. Update the seed script (`src/db/seed.ts`) if the change affects test data.

### Adding a new UI component

Reusable components live in `src/components/ui/`. They follow the shadcn/ui pattern: each is a self-contained file that uses Tailwind classes and the `cn()` utility for conditional class merging.

## Environment variables

Defined in `.env` at the project root:

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Path to the SQLite database file | `file:./db/placements.db` |
| `BETTER_AUTH_SECRET` | Secret key for signing session tokens (change in production) | Placeholder value |
| `BETTER_AUTH_URL` | Base URL of the app (used by Better Auth for callbacks) | `http://localhost:3000` |

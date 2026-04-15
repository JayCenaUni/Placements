# Changelog

All notable changes to the Placements system are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Changed

- **UI component library → shadcn/ui** — Replaced hand-rolled UI primitives with official shadcn/ui components backed by Radix UI. This gives proper accessible behaviour (e.g. `asChild` via `@radix-ui/react-slot` on Button, Radix Label primitive, fully styled Radix Select with portal-rendered dropdown). A `components.json` config has been added so future components can be installed with `npx shadcn@latest add <name>`.
- **Button** — Now uses `@radix-ui/react-slot` for the `asChild` prop, rendering the child element directly with button styling instead of wrapping it in a `<button>`.
- **Label** — Now wraps `@radix-ui/react-label` for accessible label–input binding.
- **Select** — Replaced the native `<select>` wrapper with the full Radix-based shadcn Select (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`). Updated all 5 consumer files (`register.tsx`, `placements/$placementId.tsx`, `placements/new.tsx`, `reviews/new.tsx`, `requests/new.tsx`) to use the new API. Form data submission preserved via the Radix `name` prop.
- **CSS** — Added animation keyframes (`enter`/`exit`) and custom utilities (`fade-in`, `fade-out`, `zoom-in`, `zoom-out`, `slide-in-from-*`) to `app.css` to support shadcn's dropdown animations.
- **Apprentice Manager Dashboard** — Replaced the placed/unplaced KPI cards and simple apprentice list with a full **Apprentice Locations** dashboard. The new view is a table showing each managed apprentice alongside their current placement, the placement manager responsible, and where they wish to go next (derived from pending applications). Every name and placement in the table links through to its detail page.
- **Apprentice Detail Page** — Removed the binary "Placed / Unplaced" badge. The detail page now shows:
  - **Current Placement** card with title, department, and the name of the placement manager.
  - **Desired Next Placement** card listing any pending applications the apprentice has submitted.
  - **Placement History** timeline built from approved applications, displayed as a vertical timeline with the most recent placement first and a "Current" badge on the active one.
- **Apprentice List Page** — Replaced the "Unplaced" warning badge with the placement title or a neutral "No placement assigned" label.

### Added

- `components.json` — shadcn/ui configuration file (style: `new-york`, Tailwind CSS v4, lucide icons).
- Dependencies: `@radix-ui/react-slot`, `@radix-ui/react-label`, `@radix-ui/react-select`.
- `getApprenticeManagerDashboard` server function now joins through to the `placement` and placement manager `user` tables, returning per-apprentice placement details, manager names, and desired-next-placement data in a single query.
- `getApprentice` server function now returns `placementHistory` (from approved applications), `pendingApplications` (desired next placements), `currentPlacementDepartment`, and `placementManagerName`.
- New UML activity diagram: **Apprentice Manager Dashboard Flow** — documents the end-to-end workflow from loading the dashboard to drilling into an apprentice's history.
- New UML sequence diagrams: **Apprentice Manager Views Dashboard** and **Apprentice Manager Views Apprentice Detail** — document the data-loading interactions between pages, server functions, and the database.

### Updated Documentation

- `docs/uml/use-case-diagram.md` — Apprentice manager use cases updated to "View Apprentice Locations Dashboard" and "View Apprentice Detail + History"; summary table annotated with new dashboard capabilities.
- `docs/uml/activity-diagram.md` — Added section 4 covering the dashboard viewing and drill-down flow.
- `docs/uml/sequence-diagrams.md` — Added sections 7 and 8 for the manager dashboard and apprentice detail loading sequences.
- `docs/uml/component-diagram.md` — Server functions table updated to note the enriched `getApprenticeManagerDashboard` query.

### Removed

- "Unplaced" count KPI card from the apprentice manager dashboard.
- "Placed" count KPI card (replaced by "Active Placements" — the number of distinct placements currently occupied by managed apprentices).
- "Placed / Unplaced" badges throughout the apprentice manager views.
- Pending applications side panel from the manager dashboard (pending application count remains in the KPI row and links through to the full applications page).
- Hand-written `Button`, `Label`, and `Select` components (replaced by shadcn/ui versions).

---

## [0.1.0] — 2026-03-18

Initial release of the Placements system.

### Added

- **Authentication** — Email/password registration and login powered by Better Auth with Drizzle SQLite adapter. Cookie-based sessions with 7-day expiry. Three roles: `apprentice`, `apprentice_manager`, `placement_manager`.
- **Role-based dashboards** — Each role sees a tailored dashboard on login:
  - *Apprentice*: current placement, application stats, open placements count, recent applications.
  - *Apprentice Manager*: managed apprentice overview and pending applications.
  - *Placement Manager*: listing stats, application counts, recent reviews, open requests.
- **Placement management** — Placement managers can create, edit, and transition placements through `draft → open → filled → closed` lifecycle states.
- **Application workflow** — Apprentices browse open placements, submit applications with a cover message, and track status. Placement managers approve or deny; approval automatically sets the apprentice's `currentPlacementId`.
- **Reviews** — Apprentices can write one review per approved placement (rating + content). Placement managers see recent reviews on their dashboard.
- **Apprentice requests** — Placement managers can create requests for apprentices to fill their placements (`open → accepted / declined`).
- **Manager assignments** — `manager_assignment` table links apprentice managers to their apprentices (one manager per apprentice).
- **Profile management** — Apprentices maintain a profile (department, cohort, bio, skills, phone). Displayed on the apprentice detail page.
- **Sidebar navigation** — Role-filtered sidebar with links scoped to each user's permissions.
- **UI toolkit** — Shared shadcn-style primitives: Card, Button, Badge, Input, Label, Select, Textarea (later migrated to official shadcn/ui with Radix UI).
- **Database** — SQLite via libSQL/Drizzle ORM with migration support and a seed script (`db:seed`).
- **UML documentation** — Full set of Mermaid diagrams: class, use-case, activity, sequence, state, and component diagrams.

### Technical Stack

- React 19, TanStack Start (SSR) on Vite 7
- TanStack Router (file-based routing)
- Drizzle ORM + libSQL (SQLite)
- Better Auth (authentication)
- Tailwind CSS v4 + shadcn/ui primitives
- Zod v4 (input validation)
- TypeScript 5.9

# Component Diagram

Shows the system architecture and how the major components interact.

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        subgraph UI["React UI Layer"]
            Router["TanStack Router<br/>(File-based Routes)"]
            Pages["Route Pages<br/>/dashboard, /placements,<br/>/applications, /reviews, etc."]
            Components["Shared Components<br/>Sidebar, UI Primitives"]
        end
        AuthClient["Better Auth Client<br/>signIn, signUp, signOut,<br/>useSession"]
        StyleEngine["Tailwind CSS v4<br/>+ shadcn/ui"]
    end

    subgraph Server["Server (TanStack Start SSR)"]
        subgraph RouteHandlers["Route Layer"]
            BeforeLoad["beforeLoad Guards<br/>(Auth + Role checks)"]
            Loaders["Route Loaders<br/>(Data fetching via server fns)"]
        end

        subgraph ServerFunctions["Server Functions (RPC)"]
            SF_Dashboard["dashboard.ts<br/>getApprenticeDashboard<br/>getApprenticeManagerDashboard<br/>getPlacementManagerDashboard"]
            SF_Placements["placements.ts<br/>listPlacements, getPlacement<br/>createPlacement, updatePlacement<br/>applyToPlacement"]
            SF_Applications["applications.ts<br/>listApplications<br/>getApplication<br/>reviewApplication"]
            SF_Reviews["reviews.ts<br/>listReviews<br/>getReviewablePlacements<br/>createReview"]
            SF_Apprentices["apprentices.ts<br/>listApprentices, getApprentice<br/>getProfile, updateProfile"]
            SF_Managers["managers.ts<br/>listPlacementManagers"]
            SF_Requests["requests.ts<br/>listRequests, getManagerPlacements<br/>createRequest, updateRequestStatus"]
        end

        subgraph AuthServer["Authentication"]
            BetterAuth["Better Auth Server<br/>Email/Password provider<br/>Session management (7-day)"]
            AuthAPI["API Route Handler<br/>/api/auth/*"]
            AuthHelpers["Auth Helpers<br/>getSession, ensureSession"]
        end

        subgraph DataLayer["Data Access Layer"]
            DrizzleORM["Drizzle ORM<br/>(Query builder + schema)"]
            Validation["Zod v4<br/>Input validation"]
        end
    end

    subgraph Database["Database"]
        SQLite["SQLite<br/>(via @libsql/client)<br/>placements.db"]
    end

    Router --> Pages
    Pages --> Components
    Pages --> AuthClient
    Pages --> StyleEngine

    Router --> BeforeLoad
    BeforeLoad --> AuthHelpers
    Pages --> Loaders
    Loaders --> ServerFunctions

    AuthClient --> AuthAPI
    AuthAPI --> BetterAuth
    BetterAuth --> DrizzleORM

    SF_Dashboard --> DrizzleORM
    SF_Placements --> DrizzleORM
    SF_Placements --> Validation
    SF_Applications --> DrizzleORM
    SF_Reviews --> DrizzleORM
    SF_Apprentices --> DrizzleORM
    SF_Managers --> DrizzleORM
    SF_Requests --> DrizzleORM

    DrizzleORM --> SQLite
```

## Layer Descriptions

| Layer | Technology | Responsibility |
|---|---|---|
| **UI** | React 19 + TanStack Router | File-based routing, page components, shared UI primitives |
| **Styling** | Tailwind CSS v4 + shadcn/ui (CVA) | Design system, responsive layout, dark/light theme |
| **Auth Client** | Better Auth Client SDK | Client-side auth methods (signIn, signUp, signOut, useSession) |
| **Route Guards** | TanStack Router `beforeLoad` | Authentication enforcement and role-based access control |
| **Server Functions** | TanStack Start `createServerFn` | Domain logic (CRUD operations, business rules, role-scoped queries) |
| **Validation** | Zod v4 | Schema-based input validation for mutations |
| **Auth Server** | Better Auth + Drizzle adapter | Session management, password hashing, cookie-based auth |
| **ORM** | Drizzle ORM | Type-safe SQL query building, schema definition, migrations |
| **Database** | SQLite via @libsql/client | Persistent storage (file-based, Turso-compatible) |

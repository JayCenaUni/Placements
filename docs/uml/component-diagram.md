# Component Diagram

Shows the system architecture and how the major components interact.

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        Router[TanStack Router]
        Pages[Route Pages]
        Components[Shared Components]
        AuthClient[Better Auth Client]
        Styles[Tailwind CSS v4 + shadcn/ui]
    end

    subgraph Server["Server (TanStack Start SSR)"]
        subgraph RouteHandlers["Route Layer"]
            BeforeLoad[beforeLoad Guards]
            Loaders[Route Loaders]
        end

        ServerFunctions[Server Functions]

        subgraph AuthServer["Authentication"]
            BetterAuth[Better Auth Server]
            AuthAPI["/api/auth/*"]
            AuthHelpers[getSession / ensureSession]
        end

        subgraph DataLayer["Data Access Layer"]
            DrizzleORM[Drizzle ORM]
            Validation[Zod v4]
        end
    end

    subgraph Database["Database"]
        SQLite[SQLite via libsql]
    end

    Router --> Pages
    Pages --> Components
    Pages --> Styles
    Pages --> AuthClient

    Router --> BeforeLoad
    BeforeLoad --> AuthHelpers
    Pages --> Loaders
    Loaders --> ServerFunctions

    AuthClient --> AuthAPI
    AuthAPI --> BetterAuth
    BetterAuth --> DrizzleORM

    ServerFunctions --> Validation
    ServerFunctions --> DrizzleORM

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

## Server Functions Detail

| Module | Functions |
|---|---|
| `dashboard.ts` | getApprenticeDashboard, getApprenticeManagerDashboard, getPlacementManagerDashboard |
| `placements.ts` | listPlacements, getPlacement, createPlacement, updatePlacement, applyToPlacement |
| `applications.ts` | listApplications, getApplication, reviewApplication |
| `reviews.ts` | listReviews, getReviewablePlacements, createReview |
| `apprentices.ts` | listApprentices, getApprentice, getProfile, updateProfile |
| `managers.ts` | listPlacementManagers |
| `requests.ts` | listRequests, getManagerPlacements, createRequest, updateRequestStatus |

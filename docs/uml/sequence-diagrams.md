# Sequence Diagrams

Shows the flow of key operations through the system.

## 1. User Registration

```mermaid
sequenceDiagram
    actor U as User
    participant RC as Register Page
    participant AC as Auth Client
    participant API as /api/auth/*
    participant BA as Better Auth
    participant DB as SQLite

    U->>RC: Fill form (name, email, password, role)
    RC->>AC: signUp.email({ name, email, password, role })
    AC->>API: POST /api/auth/sign-up/email
    API->>BA: auth.handler(request)
    BA->>BA: Hash password
    BA->>DB: INSERT user (id, name, email, role)
    BA->>DB: INSERT account (userId, providerId, password)
    BA->>DB: INSERT session (userId, token, expiresAt)
    DB-->>BA: OK
    BA-->>API: Session + Set-Cookie
    API-->>AC: 200 + session cookie
    AC-->>RC: Success
    RC->>RC: Navigate to /dashboard
```

## 2. User Login

```mermaid
sequenceDiagram
    actor U as User
    participant LC as Login Page
    participant AC as Auth Client
    participant API as /api/auth/*
    participant BA as Better Auth
    participant DB as SQLite

    U->>LC: Enter email + password
    LC->>AC: signIn.email({ email, password })
    AC->>API: POST /api/auth/sign-in/email
    API->>BA: auth.handler(request)
    BA->>DB: SELECT user WHERE email = ?
    DB-->>BA: User record
    BA->>BA: Verify password hash
    BA->>DB: INSERT session (userId, token, expiresAt)
    DB-->>BA: OK
    BA-->>API: Session + Set-Cookie
    API-->>AC: 200 + session cookie
    AC-->>LC: Success
    LC->>LC: Navigate to /dashboard
```

## 3. Route Authentication Guard

```mermaid
sequenceDiagram
    participant Router as TanStack Router
    participant BL as beforeLoad (_authed)
    participant SF as getSession()
    participant BA as Better Auth
    participant DB as SQLite

    Router->>BL: Navigate to protected route
    BL->>SF: getSession()
    SF->>BA: auth.api.getSession(headers)
    BA->>DB: SELECT session WHERE token = ? AND expiresAt > now
    alt Valid session
        DB-->>BA: Session + User
        BA-->>SF: { user, session }
        SF-->>BL: Session data
        BL-->>Router: Continue (context.session = data)
    else No/expired session
        DB-->>BA: null
        BA-->>SF: null
        SF-->>BL: null
        BL-->>Router: Redirect to /login
    end
```

## 4. Apprentice Applies to Placement

```mermaid
sequenceDiagram
    actor A as Apprentice
    participant PD as Placement Detail Page
    participant SF as applyToPlacement()
    participant DB as SQLite

    A->>PD: Click "Apply" + enter cover message
    PD->>SF: applyToPlacement({ apprenticeId, placementId, coverMessage })
    SF->>DB: SELECT application WHERE apprenticeId = ? AND placementId = ?
    alt Already applied
        DB-->>SF: Existing record
        SF-->>PD: Error: "Already applied"
        PD-->>A: Show error message
    else New application
        DB-->>SF: Empty
        SF->>DB: INSERT application (id, apprenticeId, placementId, coverMessage, status='pending')
        DB-->>SF: OK
        SF-->>PD: { id }
        PD-->>A: Application submitted successfully
    end
```

## 5. Placement Manager Reviews Application

```mermaid
sequenceDiagram
    actor PM as Placement Manager
    participant AD as Application Detail Page
    participant SF as reviewApplication()
    participant DB as SQLite

    PM->>AD: View application details
    PM->>AD: Click "Approve" or "Deny"
    AD->>SF: reviewApplication({ applicationId, status, reviewedBy })

    SF->>DB: UPDATE application SET status, reviewedBy, reviewedAt
    DB-->>SF: OK

    alt Status is "approved"
        SF->>DB: SELECT application WHERE id = ?
        DB-->>SF: Application (apprenticeId, placementId)
        SF->>DB: SELECT apprentice_profile WHERE userId = apprenticeId
        alt Profile exists
            DB-->>SF: Existing profile
            SF->>DB: UPDATE apprentice_profile SET currentPlacementId = placementId
        else No profile
            DB-->>SF: null
            SF->>DB: INSERT apprentice_profile (userId, currentPlacementId)
        end
        DB-->>SF: OK
    end

    SF-->>AD: { success: true }
    AD-->>PM: Application reviewed
```

## 6. Create Placement

```mermaid
sequenceDiagram
    actor PM as Placement Manager
    participant NP as New Placement Page
    participant Val as Zod Validator
    participant SF as createPlacement()
    participant DB as SQLite

    PM->>NP: Fill placement form
    PM->>NP: Click "Create"
    NP->>SF: createPlacement({ title, description, department, ... })
    SF->>Val: Validate input against schema
    alt Invalid input
        Val-->>SF: Validation error
        SF-->>NP: Error details
        NP-->>PM: Show validation errors
    else Valid input
        Val-->>SF: Parsed data
        SF->>DB: INSERT placement (id, title, description, department, status, ...)
        DB-->>SF: OK
        SF-->>NP: { id }
        NP->>NP: Navigate to /placements/{id}
        NP-->>PM: Placement created
    end
```

## 7. Apprentice Writes Review

```mermaid
sequenceDiagram
    actor A as Apprentice
    participant NR as New Review Page
    participant SF_List as getReviewablePlacements()
    participant SF_Create as createReview()
    participant DB as SQLite

    A->>NR: Navigate to /reviews/new
    NR->>SF_List: getReviewablePlacements(userId)
    SF_List->>DB: SELECT placements with approved applications
    DB-->>SF_List: Approved placements
    SF_List->>DB: SELECT existing reviews by user
    DB-->>SF_List: Already-reviewed placements
    SF_List-->>NR: Reviewable placements (approved minus reviewed)
    NR-->>A: Show placement dropdown

    A->>NR: Select placement, rate, write content
    NR->>SF_Create: createReview({ apprenticeId, placementId, rating, content })
    SF_Create->>DB: SELECT review WHERE apprenticeId AND placementId
    alt Already reviewed
        DB-->>SF_Create: Existing review
        SF_Create-->>NR: Error: "Already reviewed"
    else New review
        DB-->>SF_Create: Empty
        SF_Create->>DB: INSERT review
        DB-->>SF_Create: OK
        SF_Create-->>NR: { id }
        NR-->>A: Review submitted
    end
```

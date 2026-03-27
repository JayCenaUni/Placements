# Class Diagram

Shows all domain entities, their attributes, and relationships.

```mermaid
classDiagram
    class User {
        +String id PK
        +String name
        +String email UK
        +Boolean emailVerified
        +String image
        +Role role
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Session {
        +String id PK
        +DateTime expiresAt
        +String token UK
        +DateTime createdAt
        +DateTime updatedAt
        +String ipAddress
        +String userAgent
        +String userId FK
    }

    class Account {
        +String id PK
        +String accountId
        +String providerId
        +String userId FK
        +String accessToken
        +String refreshToken
        +String idToken
        +DateTime accessTokenExpiresAt
        +DateTime refreshTokenExpiresAt
        +String scope
        +String password
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Verification {
        +String id PK
        +String identifier
        +String value
        +DateTime expiresAt
        +DateTime createdAt
        +DateTime updatedAt
    }

    class ApprenticeProfile {
        +String id PK
        +String userId FK UK
        +String department
        +String cohort
        +String bio
        +String skills
        +String phone
        +String currentPlacementId FK
    }

    class Placement {
        +String id PK
        +String title
        +String description
        +String department
        +String location
        +Integer durationWeeks
        +String startDate
        +String endDate
        +Integer capacity
        +String placementManagerId FK
        +PlacementStatus status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Application {
        +String id PK
        +String apprenticeId FK
        +String placementId FK
        +String coverMessage
        +ApplicationStatus status
        +String reviewedBy FK
        +DateTime reviewedAt
        +DateTime appliedAt
    }

    class Review {
        +String id PK
        +String apprenticeId FK
        +String placementId FK
        +Integer rating
        +String title
        +String content
        +DateTime createdAt
    }

    class ManagerAssignment {
        +String id PK
        +String managerId FK
        +String apprenticeId FK UK
        +DateTime assignedAt
    }

    class ApprenticeRequest {
        +String id PK
        +String placementManagerId FK
        +String placementId FK
        +String message
        +RequestStatus status
        +DateTime createdAt
    }

    class Role {
        <<enumeration>>
        apprentice
        apprentice_manager
        placement_manager
    }

    class PlacementStatus {
        <<enumeration>>
        draft
        open
        filled
        closed
    }

    class ApplicationStatus {
        <<enumeration>>
        pending
        approved
        denied
        withdrawn
    }

    class RequestStatus {
        <<enumeration>>
        open
        accepted
        declined
    }

    User "1" --> "*" Session : has
    User "1" --> "*" Account : has
    User "1" --> "0..1" ApprenticeProfile : has profile
    User "1" --> "*" Placement : manages
    User "1" --> "*" Application : submits (as apprentice)
    User "1" --> "*" Application : reviews (reviewedBy)
    User "1" --> "*" Review : writes
    User "1" --> "*" ManagerAssignment : manages (as AM)
    User "1" --> "0..1" ManagerAssignment : assigned to (as apprentice)
    User "1" --> "*" ApprenticeRequest : creates (as PM)

    Placement "1" --> "*" Application : receives
    Placement "1" --> "*" Review : receives
    Placement "1" --> "*" ApprenticeRequest : linked to
    Placement "1" --> "*" ApprenticeProfile : current placement of

    User ..> Role : has role
    Placement ..> PlacementStatus : has status
    Application ..> ApplicationStatus : has status
    ApprenticeRequest ..> RequestStatus : has status
```

## Relationship Summary

| Relationship | Cardinality | Description |
|---|---|---|
| User → Session | 1 to many | Each user can have multiple active sessions (cascade delete) |
| User → Account | 1 to many | Each user has at least one credential account (cascade delete) |
| User → ApprenticeProfile | 1 to 0..1 | Apprentices have one optional profile (cascade delete) |
| User → Placement | 1 to many | Placement managers create and own placements |
| User → Application (apprentice) | 1 to many | Apprentices submit applications |
| User → Application (reviewer) | 1 to many | Managers review applications (set null on delete) |
| User → Review | 1 to many | Apprentices write reviews |
| User → ManagerAssignment (manager) | 1 to many | Apprentice managers are assigned multiple apprentices |
| User → ManagerAssignment (apprentice) | 1 to 0..1 | Each apprentice has at most one manager assignment |
| User → ApprenticeRequest | 1 to many | Placement managers create apprentice requests |
| Placement → Application | 1 to many | Each placement receives applications (cascade delete) |
| Placement → Review | 1 to many | Each placement receives reviews (cascade delete) |
| Placement → ApprenticeRequest | 1 to many | Placement managers request apprentices for placements |
| Placement → ApprenticeProfile | 1 to many | Tracks which apprentices are currently on this placement |

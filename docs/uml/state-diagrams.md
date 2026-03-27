# State Diagrams

Shows the lifecycle state transitions for key domain entities.

## 1. Placement Status

A placement moves through its lifecycle from creation to closure.

```mermaid
stateDiagram-v2
    [*] --> Draft : createPlacement()

    Draft --> Open : updatePlacement(status: "open")
    Draft --> Closed : updatePlacement(status: "closed")

    Open --> Filled : updatePlacement(status: "filled")
    Open --> Closed : updatePlacement(status: "closed")
    Open --> Draft : updatePlacement(status: "draft")

    Filled --> Closed : updatePlacement(status: "closed")
    Filled --> Open : updatePlacement(status: "open")

    Closed --> [*]

    state Draft {
        [*] --> [*] : Placement Manager edits details
    }

    note right of Draft
        Not visible to apprentices
        (PM still editing)
    end note
    note right of Open
        Apprentices can browse
        and apply
    end note
    note right of Filled
        All capacity allocated
        no new applications
    end note
    note right of Closed
        Placement completed
        or cancelled
    end note
```

## 2. Application Status

An application moves from submission through to a final decision.

```mermaid
stateDiagram-v2
    [*] --> Pending : applyToPlacement()

    Pending --> Approved : reviewApplication(status: "approved")
    Pending --> Denied : reviewApplication(status: "denied")
    Pending --> Withdrawn : Apprentice withdraws

    Approved --> [*]
    Denied --> [*]
    Withdrawn --> [*]

    note right of Pending
        Awaiting review by
        Placement Manager
    end note
    note right of Approved
        Apprentice profile updated
        with currentPlacementId
    end note
    note right of Denied
        Application rejected
        by Placement Manager
    end note
    note right of Withdrawn
        Apprentice cancelled
        their application
    end note
```

### Approval Side Effect

When an application is approved, the system automatically:
1. Looks up the apprentice's profile
2. If a profile exists: updates `currentPlacementId` to the approved placement
3. If no profile exists: creates a new profile with `currentPlacementId` set

## 3. Apprentice Request Status

A placement manager requests an apprentice for one of their placements.

```mermaid
stateDiagram-v2
    [*] --> Open : createRequest()

    Open --> Accepted : updateRequestStatus(status: "accepted")
    Open --> Declined : updateRequestStatus(status: "declined")

    Accepted --> [*]
    Declined --> [*]

    note right of Open
        Placement Manager has
        requested an apprentice
        for a placement
    end note
    note right of Accepted
        Request fulfilled
    end note
    note right of Declined
        Request denied
    end note
```

## State Summary Table

| Entity | States | Transitions | Triggered By |
|---|---|---|---|
| **Placement** | `draft` → `open` → `filled` → `closed` | `updatePlacement()` | Placement Manager |
| **Application** | `pending` → `approved` / `denied` / `withdrawn` | `reviewApplication()` | Placement Manager (approve/deny), Apprentice (withdraw) |
| **ApprenticeRequest** | `open` → `accepted` / `declined` | `updateRequestStatus()` | System / Apprentice Manager |

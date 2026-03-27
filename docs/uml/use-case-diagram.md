# Use Case Diagram

Shows the interactions each actor role has with the Placements system.

```mermaid
graph LR
    subgraph Actors
        A((Apprentice))
        AM((Apprentice<br/>Manager))
        PM((Placement<br/>Manager))
    end

    subgraph Authentication
        UC_REG[Register]
        UC_LOGIN[Login]
        UC_LOGOUT[Logout]
    end

    subgraph Shared
        UC_DASH[View Dashboard]
        UC_PROF[Manage Profile]
        UC_BROWSE[Browse Placements]
        UC_VIEW_P[View Placement Details]
        UC_VIEW_APPS[View Applications]
        UC_VIEW_REVIEWS[View Reviews]
    end

    subgraph Apprentice Only
        UC_APPLY[Apply to Placement]
        UC_WRITE_REV[Write Placement Review]
    end

    subgraph Manager Shared
        UC_VIEW_APPRENTICES[View Apprentices]
        UC_VIEW_APPRENTICE[View Apprentice Details]
    end

    subgraph Apprentice Manager Only
        UC_VIEW_MGRS[View Manager Assignments]
    end

    subgraph Placement Manager Only
        UC_CREATE_P[Create Placement]
        UC_UPDATE_P[Update Placement]
        UC_REVIEW_APP[Review Application<br/>Approve / Deny]
        UC_CREATE_REQ[Create Apprentice Request]
        UC_MANAGE_REQ[Manage Requests]
    end

    %% All roles — authentication
    A --- UC_REG
    A --- UC_LOGIN
    A --- UC_LOGOUT
    AM --- UC_REG
    AM --- UC_LOGIN
    AM --- UC_LOGOUT
    PM --- UC_REG
    PM --- UC_LOGIN
    PM --- UC_LOGOUT

    %% All roles — shared features
    A --- UC_DASH
    A --- UC_PROF
    A --- UC_BROWSE
    A --- UC_VIEW_P
    A --- UC_VIEW_APPS
    A --- UC_VIEW_REVIEWS
    AM --- UC_DASH
    AM --- UC_PROF
    AM --- UC_BROWSE
    AM --- UC_VIEW_P
    AM --- UC_VIEW_APPS
    AM --- UC_VIEW_REVIEWS
    PM --- UC_DASH
    PM --- UC_PROF
    PM --- UC_BROWSE
    PM --- UC_VIEW_P
    PM --- UC_VIEW_APPS
    PM --- UC_VIEW_REVIEWS

    %% Apprentice only
    A --- UC_APPLY
    A --- UC_WRITE_REV

    %% Manager shared
    AM --- UC_VIEW_APPRENTICES
    AM --- UC_VIEW_APPRENTICE
    PM --- UC_VIEW_APPRENTICES
    PM --- UC_VIEW_APPRENTICE

    %% Apprentice Manager only
    AM --- UC_VIEW_MGRS

    %% Placement Manager only
    PM --- UC_CREATE_P
    PM --- UC_UPDATE_P
    PM --- UC_REVIEW_APP
    PM --- UC_CREATE_REQ
    PM --- UC_MANAGE_REQ
```

## Use Case Descriptions

| Use Case | Actor(s) | Description |
|---|---|---|
| Register | All | Create an account with name, email, password, and role |
| Login | All | Authenticate with email and password |
| Logout | All | End current session |
| View Dashboard | All | Role-specific summary (stats, recent activity) |
| Manage Profile | All | View and update profile info (bio, skills, phone, department) |
| Browse Placements | All | List placements with optional status filter |
| View Placement Details | All | See full placement info and its applications |
| View Applications | All | Role-scoped application list (own, managed, or owned placements) |
| View Reviews | All | Role-scoped review list |
| Apply to Placement | Apprentice | Submit a cover message to apply for an open placement |
| Write Placement Review | Apprentice | Rate and review an approved placement (one per placement) |
| View Apprentices | AM, PM | List apprentice users and their profiles |
| View Apprentice Details | AM, PM | See individual apprentice profile and current placement |
| View Manager Assignments | AM | See which apprentices are assigned to which managers |
| Create Placement | PM | Draft a new placement listing |
| Update Placement | PM | Edit placement details or change status |
| Review Application | PM | Approve or deny an application (auto-assigns on approval) |
| Create Apprentice Request | PM | Request an apprentice for a specific placement |
| Manage Requests | PM | View and update status of apprentice requests |

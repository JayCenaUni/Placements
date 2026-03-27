# Activity Diagrams

Shows the end-to-end workflows across multiple actors.

## 1. Placement Application Workflow

The full lifecycle from placement creation to apprentice assignment.

```mermaid
flowchart TD
    Start([Start]) --> CreatePlacement

    subgraph PM_Create ["Placement Manager"]
        CreatePlacement["Create Placement (draft)"]
        EditPlacement[Edit Placement Details]
        PublishPlacement["Set status: open"]
        CreatePlacement --> EditPlacement
        EditPlacement --> PublishPlacement
    end

    PublishPlacement --> BrowsePlacements

    subgraph Apprentice_Apply ["Apprentice"]
        BrowsePlacements[Browse Open Placements]
        ViewPlacement[View Placement Details]
        WriteCover[Write Cover Message]
        SubmitApp["Submit Application (pending)"]
        BrowsePlacements --> ViewPlacement
        ViewPlacement --> WriteCover
        WriteCover --> SubmitApp
    end

    SubmitApp --> ReviewApp

    subgraph PM_Review ["Placement Manager"]
        ReviewApp[View Application Details]
        Decision{Approve or Deny?}
        Approve["Set status: approved"]
        Deny["Set status: denied"]
        ReviewApp --> Decision
        Decision -->|Approve| Approve
        Decision -->|Deny| Deny
    end

    Approve --> UpdateProfile[Update Apprentice Profile currentPlacementId]
    Deny --> DenyEnd([Application Denied])

    UpdateProfile --> FillCheck{Placement at capacity?}
    FillCheck -->|Yes| MarkFilled["Set placement status: filled"]
    FillCheck -->|No| WaitMore([Await More Applications])
    MarkFilled --> PlacementActive([Placement Active])
```

## 2. Review Submission Workflow

How an apprentice submits a review after completing a placement.

```mermaid
flowchart TD
    Start([Apprentice navigates to New Review]) --> FetchReviewable

    FetchReviewable[Fetch Reviewable Placements]
    FetchReviewable --> GetApproved[Get placements with approved applications]
    GetApproved --> GetExisting[Get already-reviewed placements]
    GetExisting --> Filter[Filter: approved minus reviewed]
    Filter --> HasPlacements{Any reviewable placements?}

    HasPlacements -->|No| NoReview([No placements to review])
    HasPlacements -->|Yes| ShowForm[Show review form with placement dropdown]

    ShowForm --> FillForm[Select placement, set rating, write content]
    FillForm --> CheckDupe{Already reviewed this placement?}
    CheckDupe -->|Yes| DupeError([Error: Already reviewed])
    CheckDupe -->|No| SaveReview[Insert review record]
    SaveReview --> Done([Review submitted])
```

## 3. Apprentice Request Workflow

A placement manager requests apprentices for their placements.

```mermaid
flowchart TD
    Start([Placement Manager navigates to New Request]) --> FetchPlacements

    FetchPlacements[Fetch manager's placements]
    FetchPlacements --> ShowForm[Show request form with placement dropdown]
    ShowForm --> FillForm[Select placement and write optional message]
    FillForm --> Submit["Create request (open)"]

    Submit --> Notify([Request visible in requests list])

    Notify --> ResponseDecision{Response}
    ResponseDecision -->|Accept| Accepted["Set status: accepted"]
    ResponseDecision -->|Decline| Declined["Set status: declined"]
    Accepted --> Done([Request fulfilled])
    Declined --> DoneDeclined([Request closed])
```

## 4. Authentication Flow

The complete user authentication lifecycle.

```mermaid
flowchart TD
    Start([User visits app]) --> CheckSession{Has valid session cookie?}

    CheckSession -->|Yes| LoadDash[Load Dashboard via _authed layout]
    CheckSession -->|No| ShowLogin[Show Login Page]

    ShowLogin --> LoginOrReg{Login or Register?}
    LoginOrReg -->|Login| EnterCreds[Enter email and password]
    LoginOrReg -->|Register| EnterRegInfo["Enter name, email, password, role"]

    EnterCreds --> ValidateCreds{Valid credentials?}
    ValidateCreds -->|Yes| CreateSession["Create session (7-day expiry)"]
    ValidateCreds -->|No| ShowError[Show error message]
    ShowError --> ShowLogin

    EnterRegInfo --> ValidateReg{Valid registration?}
    ValidateReg -->|Yes| CreateUser[Create user, account, and session]
    ValidateReg -->|No| ShowRegError[Show validation errors]
    ShowRegError --> ShowLogin

    CreateSession --> SetCookie[Set session cookie]
    CreateUser --> SetCookie

    SetCookie --> LoadDash

    LoadDash --> UseApp([User interacts with app])
    UseApp --> Logout{Sign out?}
    Logout -->|Yes| ClearSession[Delete session and clear cookie]
    ClearSession --> ShowLogin
    Logout -->|No| UseApp
```

# Use Case Diagrams

Shows the interactions each actor role has with the Placements system. Split by role to avoid edge overlap.

## 1. Apprentice

```mermaid
graph LR
    A((Apprentice))

    A --- Register
    A --- Login
    A --- Logout
    A --- Dashboard[View Dashboard]
    A --- Profile[Manage Profile]
    A --- ViewComps[View Own Competencies]
    A --- Browse[Browse Placements]
    A --- SortGaps[Sort Placements by Competency Gaps]
    A --- ViewP[View Placement Details + Competency Gaps]
    A --- Apply[Apply to Placement]
    A --- ViewApps[View Own Applications]
    A --- WriteRev[Write Placement Review]
    A --- ViewRevs[View Reviews]
```

## 2. Apprentice Manager

```mermaid
graph LR
    AM((Apprentice Manager))

    AM --- Register
    AM --- Login
    AM --- Logout
    AM --- Dashboard[View Apprentice Locations Dashboard]
    AM --- Profile[Manage Profile]
    AM --- Browse[Browse Placements]
    AM --- ViewP[View Placement Details]
    AM --- ViewApps[View Managed Applications]
    AM --- ViewRevs[View Reviews]
    AM --- ViewList[View Apprentices]
    AM --- ViewDetail[View Apprentice Detail + History + Competencies]
    AM --- Managers[View Manager Assignments]
```

## 3. Placement Manager

```mermaid
graph LR
    PM((Placement Manager))

    PM --- Register
    PM --- Login
    PM --- Logout
    PM --- Dashboard[View Dashboard]
    PM --- Profile[Manage Profile]
    PM --- Browse[Browse Placements]
    PM --- ViewP[View Placement Details + Competencies]
    PM --- Create[Create Placement]
    PM --- Update[Update Placement]
    PM --- ViewApps[View Applications]
    PM --- Review[Review Application - Approve/Deny]
    PM --- ViewRevs[View Reviews]
    PM --- ViewList[View Apprentices]
    PM --- ViewDetail[View Apprentice Details + Competencies]
    PM --- CreateReq[Create Apprentice Request]
    PM --- ManageReq[Manage Requests]
```

## Use Case Summary

| Use Case | Apprentice | Apprentice Manager | Placement Manager |
|---|:---:|:---:|:---:|
| Register / Login / Logout | x | x | x |
| View Dashboard | x | x (apprentice locations, desired next placements) | x |
| Manage Profile | x | x | x |
| View Own Competencies | x (on profile) | | |
| Browse Placements | x | x | x |
| Sort Placements by Competency Gaps | x | | |
| View Placement Details + Competencies | x (with gap/achieved indicators) | x | x |
| View Applications | x (own) | x (managed) | x (own placements) |
| View Reviews | x | x | x |
| Apply to Placement | x | | |
| Write Placement Review | x | | |
| View Apprentices | | x | x |
| View Apprentice Details + History + Competencies | | x | x |
| View Manager Assignments | | x | |
| Create Placement | | | x |
| Update Placement | | | x |
| Review Application (Approve/Deny) | | | x |
| Create Apprentice Request | | | x |
| Manage Requests | | | x |

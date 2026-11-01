# Requirements Specification: Lotus Caterer Management System

This document contains **only confirmed client requirements** and explicitly registers all **unresolved business questions**.

> [!IMPORTANT]
> Engineering Rule: Do not invent features, business rules, access permissions, or financial algorithms beyond what is documented here. All assumptions are strictly prohibited.

---

## 1. Confirmed Client Requirements

### 1.1 Partner Accounts
- **Three Partner Accounts**: The business is owned and operated by three partners, each requiring an individual account within the system.
- **Deposit Recording**: Each partner can record their deposits (capital injected or incoming funds held by that partner).
- **Expense Recording**: Each partner can record expenses they have paid for.
- **Individual Partner Fund Tracking**: The system must track how much money each individual partner currently holds/has.
- **Combined Financial Overview**: The system must maintain a combined financial overview aggregating the partner accounts.

### 1.2 Bookings
- **Booking Records**: Booking details must be recorded and maintained.
- **Guest Details**: Details regarding the guest/client who placed the booking must be maintained.

### 1.3 Events / Jobs
- **Event / Job Creation**: New events or catering jobs can be created in the system.
- **Event-wise Financial Records**: Individual event-wise income and expenses must be recorded.
- **Event Cashflow Tracking**: The system must track how much money each specific event received and how much it spent.

### 1.4 Income
- **Source Tracking**: Track where incoming money originated (source/payer/channel).
- **Event Income Tracking**: Track how much money was received specifically from each job or event.

### 1.5 Expenses
- **Expense Records**: Maintain comprehensive expense records.
- **Overall Expenditure**: Track total overall business expenditure across all operations.
- **Event-specific Expenditure**: Track expenditures incurred specifically for individual events/jobs.

### 1.6 Financial Overview
- **Total Money Received**: Track overall gross funds received across all operations.
- **Total Money Spent**: Track overall gross funds spent across all operations.
- **Account Balances**: Maintain accurate, real-time overall account balances.
- **Summaries**:
  - Maintain partner-wise financial summaries.
  - Maintain event-wise financial summaries.

### 1.7 Attachments & Proof of Transaction
- **Bill & Receipt Attachments**: Income and expense transactions must support bill/receipt image attachments.
- **Verification Access**: Images must remain accessible and viewable at any later date for verification and auditing.

---

## 2. Unresolved Business Questions

The following questions require formal client clarification before corresponding domain logic, relationships, or workflows can be finalized. AI agents and engineers must **not make assumptions or implement speculative solutions** for any of these items:

| # | Unresolved Question | Impact on Design / Architecture | Status |
| :--- | :--- | :--- | :--- |
| **Q1** | **Are bookings and events separate entities?** | Dictates whether Booking and Event are distinct database models or synonyms. | **Pending Clarification** |
| **Q2** | **Can one booking contain multiple events?** | Affects one-to-one vs. one-to-many relationship modeling between Bookings and Events (e.g., a multi-day wedding with separate ceremonies). | **Pending Clarification** |
| **Q3** | **What exactly are the three user roles?** | **RESOLVED in Phase 2**: Confirmed equal 3-partner access model. Exactly three partners with individual credentials, shared internal visibility, equal administrative rights, and no Admin/Staff hierarchy. | **CONFIRMED & IMPLEMENTED** |
| **Q4** | **Can partners transfer money between themselves?** | Affects the transaction model: determines if inter-partner balance adjustments/transfers need explicit double-entry records. | **Pending Clarification** |
| **Q5** | **How should shared expenses be allocated?** | Determines cost-allocation logic: are general business overhead expenses split equally (1/3 each), weighted by partner, or kept at an entity level? | **Pending Clarification** |
| **Q6** | **What are the rules for final profit distribution?** | Dictates financial year-end or event-closeout calculations: how is net surplus distributed among the three partners? | **Pending Clarification** |

---

## 3. Scope Boundary

- **In Scope (Current & Planned Phases)**:
  - Partner account balance tracking.
  - Event and booking lifecycle tracking.
  - Income and expense transaction ledger with receipt image attachments.
  - Aggregated financial dashboards (overall, partner-wise, event-wise).
  - Secure authentication and role-based access for the three partners.
- **Explicitly Out of Scope**:
  - Complex automated accounting distributions without client confirmation.
  - Public customer-facing ordering portals or food delivery apps.
  - Inventory forecasting / POS hardware integrations unless explicitly contracted.

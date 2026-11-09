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

### 1.8 Centralized Financial Ledger & Accounting Model (Confirmed in Phase 4)
- **Single Centralized Ledger**: All financial views (Common Business Account, Partner accounts, Event-wise accounts, and Date-wise history) derive from ONE centralized `Transaction` collection.
- **Three Core Transaction Types**:
  1. `BUSINESS_INCOME`: Money received by the catering business (customer payments, event advances). Attributed to `COMMON_BUSINESS` funds pool; optional catering event linkage.
  2. `PARTNER_CONTRIBUTION`: Money personally injected by a partner into the common business pool. Increases available business funds but is strictly **NOT** business revenue.
  3. `BUSINESS_EXPENSE`: Operational expenditures with two supported payment routes:
     - `COMMON_BUSINESS`: Paid from common business funds; immediately deducted from common business cash balance.
     - `PARTNER_PERSONAL`: Paid directly from a partner's personal pocket; includes the paying partner ID. Included in total business expenditure reporting, but does **NOT** reduce common business cash pool.
- **Mathematical Balance Calculations (Paise Precision)**:
  - `Common Business Balance = Total Business Income + Total Partner Contributions - Common Account Expenses`
  - `Total Business Income = Sum(BUSINESS_INCOME)`
  - `Total Business Expenses = Sum(BUSINESS_EXPENSE [COMMON_BUSINESS + PARTNER_PERSONAL])`
- **Date-Wise Expense History**: Daily expenditure aggregation with Asia/Kolkata timezone normalization.
- **Auditable Image Attachments**: Multi-image bill and receipt attachment capability for income, expenses, and contributions.

### 1.9 Phase 5 Advanced Accounts, Cash Custody, Due Management & Invoicing
- **Customer Due Management**:
  - Track customer receivables against invoices with payment histories.
  - Automatic balance updates (`remainingDue = grandTotal - amountPaid`).
  - Overpayment prevention (`amount <= remainingDue`).
  - No double counting of income (customer payments emit a single `BUSINESS_INCOME` ledger transaction).
  - Status progression: `UNPAID` -> `PARTIALLY_PAID` -> `PAID` (or `OVERDUE` if past due date).
- **Vendor Due Management**:
  - Track supplier payables without prematurely recognizing unpaid bills as business cash expenses.
  - Recording vendor payment emits a `BUSINESS_EXPENSE` ledger transaction.
  - Overpayment prevention (`amount <= remainingAmount`).
  - Status progression: `UNPAID` -> `PARTIALLY_PAID` -> `PAID` / `OVERDUE`.
- **Partner Business Cash Custody**:
  - Strictly physical cash custody held by partners, distinct from personal money.
  - 6 movement types: `CASH_INCOME_ASSIGNED`, `PARTNER_HANDOVER`, `BANK_DEPOSIT`, `BANK_WITHDRAWAL`, `CASH_EXPENSE`, `OPENING_BALANCE`.
  - Non-negative balance validation: partners cannot transfer or spend more cash than their current physical custody.
  - Cash-to-bank and handover movements shift custody channels without creating duplicate income/expense.
  - Reconciled against total business liquid assets (`Common Business Balance = Total Physical Cash in Hand + Common Bank Balance`).
- **Billing & Invoice Module**:
  - Unique invoice sequence generation (`LC-YYYY-XXXX`).
  - Support for both GST Tax Invoices and Non-GST Bills of Supply.
  - Configurable line-item tax rates (0%, 5%, 12%, 18%, 28%) and intra/inter-state tax splitting (CGST/SGST vs IGST).
  - Printable layout (`@media print`) and WhatsApp sharing with native share fallback.
- **Dedicated Event Financial Hub**:
  - Consolidated event overview showing invoiced amount, collections, expenses, vendor dues, and net cashflow.
- **Executive Dashboard**:
  - Six independent financial metrics (no misleading single combined balance).
  - Partner cash-in-hand cards, overdue due alerts, upcoming events in chronological order, and recent ledger activity.

### 1.10 Scope Simplification & Khatabook-Inspired UX Redesign (Phase 6)
- **Strictly 4 Core Modules**:
  1. **Booking & Events** (`/bookings` - default home view): Simple catering event creation, upcoming and past event filtering, event details, and linked financials.
  2. **Invoice & Billing** (`/invoices`): Simple GST and Non-GST bills, zero-blocker creation, instant live preview, direct editing from preview, PDF generation, and WhatsApp sharing.
  3. **Income & Expenses** (`/transactions`): Clear visual hierarchy with Green (`+ ₹`) for income and Red (`- ₹`) for expenses. Quick action buttons for `+ Cash In (Income)` and `- Cash Out (Expense)`.
  4. **Partner Accounts** (`/partners`): Clean 3-partner presentation showing individual capital contributions, personally covered business expenses, and linked transaction histories with equal access.
- **Form UX (Zero-Blocker Invoicing & Event Creation)**:
  - All user-entered customer and event details are optional.
  - Safe fallbacks auto-generate missing titles (`Catering Event - <Date>`) and default guest names (`Guest`).
  - No blocking submission due to missing non-critical details.
  - Calculation integrity preserved (no NaN or negative total values).
- **Navigation**:
  - Mobile: Exactly 4 bottom navigation tabs (Events, Billing, Income & Expenses, Partners).
  - Desktop: Simplified sidebar containing the same 4 modules.
  - Deprecated complex modules (Vendor Directory, Vendor Dues, Cash Custody Handover, Complex Reports) removed from active UI navigation.

---

## 2. Unresolved Business Questions

The following questions require formal client clarification before corresponding domain logic, relationships, or workflows can be finalized. AI agents and engineers must **not make assumptions or implement speculative solutions** for any of these items:

| # | Unresolved Question | Impact on Design / Architecture | Status |
| :--- | :--- | :--- | :--- |
| **Q1** | **Are bookings and events separate entities?** | Dictates whether Booking and Event are distinct database models or synonyms. | **RESOLVED in Phase 3**: Unified data model (`Event` / `Booking`) adopted. Every catering job is an independent record combining booking information, guest contact details, and execution date without redundant table duplication. |
| **Q2** | **Can one booking contain multiple events?** | Affects one-to-one vs. one-to-many relationship modeling between Bookings and Events. | **RESOLVED in Phase 3**: No parent-child nesting. Each job is an independent record. Architecture remains decoupled so separate sub-events can be introduced if contracted in future. |
| **Q3** | **What exactly are the three user roles?** | **RESOLVED in Phase 2**: Confirmed equal 3-partner access model. Exactly three partners with individual credentials, shared internal visibility, equal administrative rights, and no Admin/Staff hierarchy. | **CONFIRMED & IMPLEMENTED** |
| **Q4** | **Can partners transfer money between themselves?** | Affects the transaction model: determines if inter-partner balance adjustments/transfers need explicit double-entry records. | **Pending Clarification (Provisional rule: No inter-partner transfers or personal wallet balance calculations implemented)** |
| **Q5** | **How should shared expenses be allocated?** | Determines cost-allocation logic: are general business overhead expenses split equally (1/3 each), weighted by partner, or kept at an entity level? | **Pending Clarification (Provisional rule: Kept at business entity level; no speculative splits applied)** |
| **Q6** | **What are the rules for final profit distribution?** | Dictates financial year-end or event-closeout calculations: how is net surplus distributed among the three partners? | **Pending Clarification (Provisional rule: Common business balance is NOT labeled or distributed as profit)** |

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

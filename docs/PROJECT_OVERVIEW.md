# Project Overview: Lotus Caterer Management System

## 1. Executive Summary

**Lotus Caterer Management System** is a dedicated internal management application built to streamline operations and financial visibility for a three-partner catering business. 

Catering operations involve dynamic cashflows: client advances, vendor payouts, raw ingredient purchases, staff wages, and partner capital injections. Without a centralized, real-time management system, partners face uncertainty regarding partner-held funds, event profitability, and expense accountability.

This application provides a single, transparent source of truth for:
- Tracking partner deposits, personal business expenses, and current cash balances.
- Managing bookings and event commitments.
- Recording every rupee of income and expense tied to specific catering events or general overhead.
- Storing verifiable receipt and bill images for audit readiness.

---

## 2. Project Goals

1. **Financial Transparency**: Provide real-time visibility into overall company cashflow as well as individual partner funds.
2. **Event Profitability Clarity**: Give the partners clear figures on revenue received vs. expenses paid per event/job.
3. **Auditable Record-Keeping**: Ensure every expense and income item can be backed by physical proof (receipt or bill attachment).
4. **Intuitive Operational Workflow**: Offer a responsive, clean, high-performance web interface designed for rapid daily data entry and operational review.

---

## 3. Confirmed Scope

The confirmed scope encompasses the following functional domains:

### A. Partner Financial Management
- Individual accounts for the 3 partners.
- Record of deposits injected or held by each partner.
- Record of business expenses paid directly by each partner.
- Real-time balance calculations for each partner.
- Consolidated financial overview combining all partner balances.

### B. Bookings & Guest Management
- Comprehensive booking registry capturing essential booking parameters and guest contact details.

### C. Event / Job Management
- Lifecycle management for catering events and jobs.
- Direct linking of income transactions and expense outlays to specific events.
- Real-time event-level financial reporting (Gross Inflow, Gross Outflow, Net Position).

### D. Income & Expense Ledgers
- Income ledger tracking source of funds, associated event (if applicable), and receiving partner/account.
- Expense ledger tracking payee, category/purpose, associated event (if applicable), and paying partner.
- Image attachment support for receipts and invoices.

### E. Financial Summaries & Overviews
- Global overview: Total revenue, total expenditure, net available cash across all accounts.
- Partner summary: Financial breakdown per partner.
- Event summary: Financial breakdown per event.

---

## 4. Architectural Boundaries

To ensure stability, security, and long-term maintainability, the system is engineered under strict architectural constraints:
- **Client-Server Decoupling**: Modern React SPA frontend communicating via standard REST APIs with an Express backend.
- **Strict Data Validation**: Input validation with Zod on both client forms and backend routes.
- **Modular Micro-domain Architecture**: Features structured in isolated domains ready to scale as operations expand.
- **Extensible File Upload Architecture**: Clean storage abstraction designed for local storage during initial development and seamless Cloudinary integration for production.

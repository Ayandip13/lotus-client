/**
 * Centralized Query Keys Factory for Lotus Caterer Management System
 * 
 * Strict query key conventions ensuring deterministic caching, targeted invalidations,
 * and predictable data isolation across all domains.
 */

export const queryKeys = {
  // Authentication & Session
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // System Health
  health: {
    all: ['health'] as const,
  },

  // Accounts & Financial Overviews
  accounts: {
    all: ['accounts'] as const,
    summary: (filters?: { startDate?: string; endDate?: string }) =>
      [...queryKeys.accounts.all, 'summary', filters ?? {}] as const,
    partners: () => [...queryKeys.accounts.all, 'partners'] as const,
    partnerDetail: (partnerId: string) =>
      [...queryKeys.accounts.all, 'partners', partnerId] as const,
    dateWise: (date: string) =>
      [...queryKeys.accounts.all, 'dateWise', date] as const,
  },

  // Bookings & Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.events.lists(), params ?? {}] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    financials: (id: string) =>
      [...queryKeys.events.detail(id), 'financials'] as const,
  },

  // Transactions Ledger
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.transactions.lists(), params ?? {}] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },

  // Invoices & Billing
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.invoices.lists(), params ?? {}] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
  },

  // Dues (Customer & Vendor)
  dues: {
    all: ['dues'] as const,
    customer: (params?: { relatedEvent?: string; customerName?: string; search?: string; status?: string }) =>
      [...queryKeys.dues.all, 'customer', params ?? {}] as const,
    vendor: (params?: { vendor?: string; relatedEvent?: string; search?: string; status?: string }) =>
      [...queryKeys.dues.all, 'vendor', params ?? {}] as const,
  },

  // Vendors Directory & Bills
  vendors: {
    all: ['vendors'] as const,
    lists: () => [...queryKeys.vendors.all, 'list'] as const,
    list: (params?: { search?: string; category?: string }) =>
      [...queryKeys.vendors.lists(), params ?? {}] as const,
    details: () => [...queryKeys.vendors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vendors.details(), id] as const,
    bills: (params?: Record<string, any>) =>
      [...queryKeys.vendors.all, 'bills', params ?? {}] as const,
    billDetail: (id: string) =>
      [...queryKeys.vendors.all, 'billDetail', id] as const,
  },

  // Cash Custody
  cashCustody: {
    all: ['cashCustody'] as const,
    overview: () => [...queryKeys.cashCustody.all, 'overview'] as const,
    movements: (params?: Record<string, any>) =>
      [...queryKeys.cashCustody.all, 'movements', params ?? {}] as const,
  },

  // Executive Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
  },
};


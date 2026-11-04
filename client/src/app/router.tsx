import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardShellPage } from '../pages/DashboardShellPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { BookingListPage } from '../features/bookings/pages/BookingListPage';
import { BookingCreatePage } from '../features/bookings/pages/BookingCreatePage';
import { BookingDetailsPage } from '../features/bookings/pages/BookingDetailsPage';
import { BookingEditPage } from '../features/bookings/pages/BookingEditPage';
import { PartnerAccountsPage } from '../features/partners/pages/PartnerAccountsPage';
import { TransactionListPage } from '../features/transactions/pages/TransactionListPage';
import { TransactionCreatePage } from '../features/transactions/pages/TransactionCreatePage';
import { TransactionEditPage } from '../features/transactions/pages/TransactionEditPage';
import { DateWiseExpensePage } from '../features/accounts/pages/DateWiseExpensePage';
import { FinancialOverviewPage } from '../features/accounts/pages/FinancialOverviewPage';
import { CustomerDuesPage } from '../features/dues/pages/CustomerDuesPage';
import { VendorDuesPage } from '../features/dues/pages/VendorDuesPage';
import { InvoiceListPage } from '../features/invoices/pages/InvoiceListPage';
import { InvoiceCreatePage } from '../features/invoices/pages/InvoiceCreatePage';
import { InvoiceDetailsPage } from '../features/invoices/pages/InvoiceDetailsPage';
import { CashCustodyPage } from '../features/cashCustody/pages/CashCustodyPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardShellPage />,
          },
          {
            path: 'partners',
            element: <PartnerAccountsPage />,
          },
          {
            path: 'bookings',
            children: [
              {
                index: true,
                element: <BookingListPage />,
              },
              {
                path: 'new',
                element: <BookingCreatePage />,
              },
              {
                path: ':id',
                element: <BookingDetailsPage />,
              },
              {
                path: ':id/edit',
                element: <BookingEditPage />,
              },
            ],
          },
          {
            path: 'transactions',
            children: [
              {
                index: true,
                element: <TransactionListPage />,
              },
              {
                path: 'new',
                element: <TransactionCreatePage />,
              },
              {
                path: 'date-wise',
                element: <DateWiseExpensePage />,
              },
              {
                path: ':id/edit',
                element: <TransactionEditPage />,
              },
            ],
          },
          {
            path: 'overview',
            element: <FinancialOverviewPage />,
          },
          // Phase 5 Routes
          {
            path: 'dues',
            children: [
              {
                path: 'customers',
                element: <CustomerDuesPage />,
              },
              {
                path: 'vendors',
                element: <VendorDuesPage />,
              },
            ],
          },
          {
            path: 'invoices',
            children: [
              {
                index: true,
                element: <InvoiceListPage />,
              },
              {
                path: 'new',
                element: <InvoiceCreatePage />,
              },
              {
                path: ':id',
                element: <InvoiceDetailsPage />,
              },
              {
                path: ':id/edit',
                element: <InvoiceCreatePage />,
              },
            ],
          },
          {
            path: 'cash-custody',
            element: <CashCustodyPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);

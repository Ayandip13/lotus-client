import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
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
import { InvoiceListPage } from '../features/invoices/pages/InvoiceListPage';
import { InvoiceCreatePage } from '../features/invoices/pages/InvoiceCreatePage';
import { InvoiceDetailsPage } from '../features/invoices/pages/InvoiceDetailsPage';

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
          // 1. Booking & Events is the default homepage
          {
            index: true,
            element: <Navigate to="/bookings" replace />,
          },
          {
            path: 'events',
            element: <Navigate to="/bookings" replace />,
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

          // 2. Invoice & Billing
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

          // 3. Income & Expenses
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
                path: ':id/edit',
                element: <TransactionEditPage />,
              },
            ],
          },

          // 4. Partner Accounts
          {
            path: 'partners',
            element: <PartnerAccountsPage />,
          },

          // Graceful redirects from removed modules to the 4 core modules
          {
            path: 'overview',
            element: <Navigate to="/transactions" replace />,
          },
          {
            path: 'dues/customers',
            element: <Navigate to="/invoices" replace />,
          },
          {
            path: 'dues/vendors',
            element: <Navigate to="/transactions" replace />,
          },
          {
            path: 'dues',
            element: <Navigate to="/invoices" replace />,
          },
          {
            path: 'cash-custody',
            element: <Navigate to="/partners" replace />,
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

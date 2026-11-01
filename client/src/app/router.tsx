import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardShellPage } from '../pages/DashboardShellPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PhasePlaceholder } from '../pages/PhasePlaceholder';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { BookingListPage } from '../features/bookings/pages/BookingListPage';
import { BookingCreatePage } from '../features/bookings/pages/BookingCreatePage';
import { BookingDetailsPage } from '../features/bookings/pages/BookingDetailsPage';
import { BookingEditPage } from '../features/bookings/pages/BookingEditPage';

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
            element: (
              <PhasePlaceholder
                phase="Phase 2 Completed"
                title="Partner Accounts & Equal Access"
                description="All three partners have equal administrative rights, individual credentials, and shared operational visibility."
                unresolvedQuestions={[
                  'Can partners transfer money directly between themselves? (Question Q4)',
                  'How should shared overhead expenses be allocated among partners? (Question Q5)',
                ]}
              />
            ),
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
            element: (
              <PhasePlaceholder
                phase="Phase 4"
                title="Income & Expense Ledger"
                description="Record transactions, track event-specific expenditures, and attach receipt images."
                unresolvedQuestions={[
                  'Can partners transfer money directly between themselves? (Question Q4)',
                  'How should shared overhead expenses be allocated among partners? (Question Q5)',
                ]}
              />
            ),
          },
          {
            path: 'overview',
            element: (
              <PhasePlaceholder
                phase="Phase 5"
                title="Financial Overview & Analytics"
                description="Consolidated revenue, expense summaries, and partner fund balances."
                unresolvedQuestions={[
                  'What are the confirmed rules for final profit distribution? (Question Q6)',
                ]}
              />
            ),
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

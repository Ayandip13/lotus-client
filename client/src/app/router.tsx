import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardShellPage } from '../pages/DashboardShellPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PhasePlaceholder } from '../pages/PhasePlaceholder';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';

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
            element: (
              <PhasePlaceholder
                phase="Phase 3"
                title="Bookings & Events Management"
                description="Manage customer reservations, guest information, and scheduled catering jobs."
                unresolvedQuestions={[
                  'Are bookings and events separate entities? (Question Q1)',
                  'Can one booking contain multiple events (e.g. multi-day weddings)? (Question Q2)',
                ]}
              />
            ),
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

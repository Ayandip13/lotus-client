import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardShellPage } from '../pages/DashboardShellPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PhasePlaceholder } from '../pages/PhasePlaceholder';

export const router = createBrowserRouter([
  {
    path: '/',
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
            phase="Phase 2"
            title="Partner Accounts & Authentication"
            description="Manage individual partner accounts, deposits, expenses, and security access."
            unresolvedQuestions={[
              'What exactly are the three user roles?',
              'Do partners have equal administrative rights or specific permissions?',
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
              'Are bookings and events separate entities?',
              'Can one booking contain multiple events (e.g. multi-day weddings)?',
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
              'Can partners transfer money directly between themselves?',
              'How should shared overhead expenses be allocated among partners?',
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
              'What are the confirmed rules for final profit distribution?',
            ]}
          />
        ),
      },
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);

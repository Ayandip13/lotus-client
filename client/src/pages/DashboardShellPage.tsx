import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkSystemHealth } from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  Server,
  Database,
  Layers,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Clock,
  Terminal,
} from 'lucide-react';

import { useAuth } from '../features/auth/context/AuthContext';

export const DashboardShellPage: React.FC = () => {
  const { partner, user } = useAuth();
  const { data: healthResponse, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: checkSystemHealth,
  });

  const health = healthResponse?.data;

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Lotus Caterer Management
            </h1>
            <Badge variant="success">Phase 3 Active</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <strong className="text-slate-800">{partner?.name || 'Partner'}</strong> ({user ? `@${user.username}` : ''}). Equal 3-partner management session active.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Probe Health
          </Button>
          <Badge variant="outline">Equal Partner Access</Badge>
        </div>
      </div>

      {/* Operational Notice */}
      <Alert
        variant="info"
        title="Phase 3 Live: Booking, Guest & Event Management"
      >
        Independent catering job records and guest contact information are now live with full CRUD operations, pagination, search, and equal partner audit tracking. Financial transactions and balances remain scheduled for Phase 4 & 5.
      </Alert>

      {/* System Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend API Server Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Express API
            </CardTitle>
            <Server className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">
                {isLoading ? 'Probing...' : isError ? 'Offline' : 'Operational'}
              </span>
              <Badge variant={isError ? 'danger' : 'success'}>
                {isLoading ? 'Checking' : isError ? 'Error' : 'HTTP 200'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {health?.version ? `API v${health.version}` : 'Node.js Express Server'}
            </p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              MongoDB / Mongoose
            </CardTitle>
            <Database className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">
                {isLoading
                  ? 'Probing...'
                  : health?.database?.connected
                  ? 'Connected'
                  : 'Configured'}
              </span>
              <Badge variant={health?.database?.connected ? 'success' : 'neutral'}>
                {health?.database?.status || 'Lifecycle Ready'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Graceful fallback handling enabled
            </p>
          </CardContent>
        </Card>

        {/* Storage Service Adapter */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Storage Adapter
            </CardTitle>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">Prepared</span>
              <Badge variant="outline">Interface Ready</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cloudinary integration ready for Phase 4
            </p>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Server Uptime
            </CardTitle>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">
                {health?.uptime !== undefined ? `${health.uptime}s` : 'N/A'}
              </span>
              <Badge variant="neutral">{health?.environment || 'development'}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Live probe ready'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backend Health Diagnostics Detail */}
      {isError && (
        <Alert variant="warning" title="Backend Connection Notice">
          {error instanceof Error ? error.message : 'Could not reach backend health endpoint at /api/health.'}
          <div className="mt-1 text-xs text-slate-600">
            Ensure the Express server is running on port 5000 (`npm run dev:server`).
          </div>
        </Alert>
      )}

      {/* Architectural Modules Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Foundation Deliverables */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <CardTitle>Established Architecture Pillars</CardTitle>
            </div>
            <CardDescription>
              Verified standards, security layers, and contracts implemented in Phase 1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pillar</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-slate-900">Frontend Client</TableCell>
                  <TableCell>React + Vite + TypeScript + Tailwind</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-900">State & HTTP</TableCell>
                  <TableCell>TanStack Query v5 + Axios Client</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-900">Backend Server</TableCell>
                  <TableCell>Express.js + TypeScript (Modular)</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-900">Validation & Errors</TableCell>
                  <TableCell>Zod + Centralized Error Pipeline</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-900">Storage Service</TableCell>
                  <TableCell>IStorageService Abstract Contract</TableCell>
                  <TableCell><Badge variant="outline">Prepared</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Roadmap & Unresolved Clarifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <CardTitle>Unresolved Questions Registry</CardTitle>
            </div>
            <CardDescription>
              Items logged in docs/REQUIREMENTS.md requiring confirmation before Phase 2-5 implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Q1 & Q2: Booking vs. Event Entity Model</span>
                <Badge variant="warning">Awaiting Clarification</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Are bookings and events separate entities or synonymous? Can one booking have multiple events?
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Q3: Partner Role Hierarchy</span>
                <Badge variant="warning">Awaiting Clarification</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Do the 3 user accounts have equal partner privileges or distinct hierarchical roles?
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Q4-Q6: Accounting & Distribution Rules</span>
                <Badge variant="warning">Awaiting Clarification</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Can partners transfer money between themselves? How are shared expenses and profits allocated?
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Developer Command Reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <CardTitle>Developer Execution Cheatsheet</CardTitle>
          </div>
          <CardDescription>
            Standard npm scripts for building and operating this monorepo workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900 text-slate-100 space-y-1">
              <div className="text-slate-400"># Start both in dev</div>
              <div>npm run dev:server</div>
              <div>npm run dev:client</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 text-slate-100 space-y-1">
              <div className="text-slate-400"># Typecheck</div>
              <div>npm --prefix server run typecheck</div>
              <div>npm --prefix client run typecheck</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 text-slate-100 space-y-1">
              <div className="text-slate-400"># Production build</div>
              <div>npm run build</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

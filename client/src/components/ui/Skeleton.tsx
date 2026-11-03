import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 2, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showFilterBar?: boolean;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  showFilterBar = false,
  className,
}) => {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden', className)}>
      {showFilterBar && (
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-full divide-y divide-slate-100">
          <div className="bg-slate-50/80 px-6 py-3.5 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`th-${i}`} className="h-3 flex-1 rounded" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="px-6 py-4 flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton
                  key={`cell-${rowIdx}-${colIdx}`}
                  className={cn(
                    'h-4 flex-1 rounded',
                    colIdx === 0 ? 'w-1/3' : 'w-1/4'
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonForm: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className,
}) => {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6', className)}>
      <div className="space-y-2 border-b border-slate-100 pb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonDetails: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppLayoutSkeleton: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200/80 shadow-sm">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex-1 px-4 py-5 space-y-2">
          <Skeleton className="h-3 w-28 mb-3" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-36" />
            <span className="text-slate-300">/</span>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="hidden sm:block h-6 w-44 rounded-full" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="hidden md:block space-y-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Body Skeleton */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-60" />
                <Skeleton className="h-4 w-80" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>

            <SkeletonTable rows={5} columns={5} showFilterBar={true} />
          </div>
        </main>
      </div>
    </div>
  );
};


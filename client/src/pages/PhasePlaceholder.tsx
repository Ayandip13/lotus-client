import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Clock, ShieldAlert } from 'lucide-react';

interface PhasePlaceholderProps {
  phase: string;
  title: string;
  description: string;
  unresolvedQuestions?: string[];
}

export const PhasePlaceholder: React.FC<PhasePlaceholderProps> = ({
  phase,
  title,
  description,
  unresolvedQuestions,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <Badge variant="outline">{phase}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <Badge variant="neutral" className="gap-1.5 py-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Scheduled Milestone</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <CardTitle>Implementation In Progress (Phase 1 Baseline Active)</CardTitle>
          </div>
          <CardDescription>
            This module will be introduced in {phase}. No speculative logic or mock data is permitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Phase 1 strictly establishes the architectural foundation, error pipeline, type definitions, and verified project tooling.
          </p>

          {unresolvedQuestions && unresolvedQuestions.length > 0 && (
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                Awaiting Client Confirmation:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                {unresolvedQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

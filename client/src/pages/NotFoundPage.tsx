import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested management module or resource does not exist in the current system deployment.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

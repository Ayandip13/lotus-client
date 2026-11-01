import React from 'react';
import { cn } from '../../lib/utils';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  ...props
}) => {
  const configs = {
    info: {
      bg: 'bg-slate-50 border-slate-200 text-slate-800',
      icon: <Info className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
  };

  const current = configs[variant];

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm', current.bg, className)}
      {...props}
    >
      {current.icon}
      <div className="space-y-1">
        {title && <h5 className="font-semibold leading-none">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};

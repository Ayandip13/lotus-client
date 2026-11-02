import React, { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterPanelProps {
  configs: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  configs,
  values,
  onChange,
  onReset,
  className = '',
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeFilterCount = Object.entries(values).filter(
    ([_, val]) => val !== undefined && val !== ''
  ).length;

  const renderInputs = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {configs.map((config) => {
        const val = values[config.key] || '';

        if (config.type === 'select') {
          return (
            <div key={config.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">{config.label}</label>
              <select
                value={val}
                onChange={(e) => onChange(config.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="">{config.placeholder || `All ${config.label}s`}</option>
                {config.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (config.type === 'date') {
          return (
            <div key={config.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">{config.label}</label>
              <input
                type="date"
                value={val}
                onChange={(e) => onChange(config.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>
          );
        }

        return (
          <div key={config.key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">{config.label}</label>
            <input
              type="text"
              placeholder={config.placeholder || `Filter by ${config.label}`}
              value={val}
              onChange={(e) => onChange(config.key, e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm mb-6 ${className}`}>
      {/* Header bar on mobile */}
      <div className="flex items-center justify-between lg:hidden mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-xs"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-slate-900 text-white rounded-full text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Desktop inputs */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-full text-xs">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>
        {renderInputs()}
      </div>

      {/* Mobile Drawer/Accordion */}
      {isMobileOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-100 space-y-3">
          {renderInputs()}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onReset();
                setIsMobileOpen(false);
              }}
            >
              Reset
            </Button>
            <Button type="button" size="sm" onClick={() => setIsMobileOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

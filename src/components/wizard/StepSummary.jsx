import React from 'react';

/**
 * StepSummary component displays a compact overview of filled information for a specific step.
 */
export function StepSummary({ stepNumber, title, data = {}, onEdit }) {
  const entries = Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">
            {stepNumber}
          </span>
          {title}
        </h4>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            aria-label={`Edit ${title}`}
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            <span className="text-slate-800 font-medium truncate">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StepSummary;

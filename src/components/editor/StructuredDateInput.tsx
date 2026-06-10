import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, Calendar } from 'lucide-react';

interface StructuredDateInputProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  isRange?: boolean;
  onEditStateChange?: (isEditing: boolean) => void;
}

const isValidDateFormat = (val: string) => {
  if (!val) return true;
  // Matches YYYY-MM or YYYY
  return /^\d{4}(-\d{2})?$/.test(val.trim());
};

export function StructuredDateInput({
  value,
  onSave,
  placeholder = 'Date',
  className,
  isRange = true,
  onEditStateChange,
}: StructuredDateInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Range values state
  const [startVal, setStartVal] = useState('');
  const [endVal, setEndVal] = useState('');
  const [isPresent, setIsPresent] = useState(false);

  // Single value state
  const [singleVal, setSingleVal] = useState('');

  // Sync edit state to parent
  useEffect(() => {
    onEditStateChange?.(isEditing);
  }, [isEditing, onEditStateChange]);

  // Sync internal state when value or editing state changes
  useEffect(() => {
    if (!isEditing) {
      if (isRange) {
        const parts = (value || '').split(/\s*-\s*/);
        const start = parts[0] || '';
        const end = parts[1] || '';
        const endIsPresent = end.toLowerCase() === 'present';
        setStartVal(start);
        setEndVal(endIsPresent ? '' : end);
        setIsPresent(endIsPresent);
      } else {
        setSingleVal(value || '');
      }
    }
  }, [value, isRange, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (isRange) {
      const finalStart = startVal.trim();
      const finalEnd = isPresent ? 'Present' : endVal.trim();
      let finalVal = '';
      if (finalStart && finalEnd) finalVal = `${finalStart} - ${finalEnd}`;
      else if (finalStart) finalVal = finalStart;
      else if (finalEnd) finalVal = finalEnd;
      if (finalVal !== value) {
        onSave(finalVal);
      }
    } else {
      const finalVal = singleVal.trim();
      if (finalVal !== value) {
        onSave(finalVal);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (isRange) {
      const parts = (value || '').split(/\s*-\s*/);
      const start = parts[0] || '';
      const end = parts[1] || '';
      const endIsPresent = end.toLowerCase() === 'present';
      setStartVal(start);
      setEndVal(endIsPresent ? '' : end);
      setIsPresent(endIsPresent);
    } else {
      setSingleVal(value || '');
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && containerRef.current.contains(e.relatedTarget)) {
      return;
    }
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const isEmpty = !value || !value.trim();

  // Warning validation checks
  const isStartInvalid = startVal && !isValidDateFormat(startVal);
  const isEndInvalid = !isPresent && endVal && !isValidDateFormat(endVal);
  const isSingleInvalid = !isRange && singleVal && !isValidDateFormat(singleVal);
  const hasWarning = isRange ? (isStartInvalid || isEndInvalid) : isSingleInvalid;

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex flex-col bg-white dark:bg-zinc-950 border rounded p-2 shadow-md z-20 font-sans gap-2 text-xs w-64 text-left border-zinc-300 dark:border-zinc-700",
          hasWarning && "border-amber-500 dark:border-amber-600"
        )}
      >
        <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
          <Calendar size={12} />
          <span>Edit {isRange ? 'Date Range' : 'Date'}</span>
        </div>

        {isRange ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={startVal}
                onChange={(e) => setStartVal(e.target.value)}
                placeholder="YYYY-MM"
                className={cn(
                  "w-1/2 px-2 py-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100",
                  isStartInvalid && "border-amber-500 focus:ring-amber-500"
                )}
                autoFocus
              />
              <span className="text-zinc-400">—</span>
              <input
                type="text"
                value={endVal}
                onChange={(e) => setEndVal(e.target.value)}
                placeholder="YYYY-MM"
                disabled={isPresent}
                className={cn(
                  "w-1/2 px-2 py-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100",
                  isPresent && "opacity-50 bg-zinc-50 dark:bg-zinc-900",
                  isEndInvalid && "border-amber-500 focus:ring-amber-500"
                )}
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={isPresent}
                onChange={(e) => setIsPresent(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900"
              />
              <span>Currently work/study here (Present)</span>
            </label>
          </div>
        ) : (
          <input
            type="text"
            value={singleVal}
            onChange={(e) => setSingleVal(e.target.value)}
            placeholder="YYYY-MM"
            className={cn(
              "w-full px-2 py-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100",
              isSingleInvalid && "border-amber-500 focus:ring-amber-500"
            )}
            autoFocus
          />
        )}

        {hasWarning && (
          <div className="flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
            <AlertCircle size={10} className="shrink-0 mt-0.5" />
            <span>Recommended format: YYYY-MM or YYYY (e.g. 2024-05)</span>
          </div>
        )}

        <div className="flex justify-end gap-1.5 border-t border-zinc-100 dark:border-zinc-900 pt-1.5">
          <button
            type="button"
            onClick={handleCancel}
            className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'group relative cursor-text inline-block align-baseline font-sans text-xs border-b border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors',
        isEmpty && 'border-zinc-400 dark:border-zinc-600 italic text-zinc-400 dark:text-zinc-500 min-w-[4rem]',
        className
      )}
      onClick={() => setIsEditing(true)}
      onFocus={() => setIsEditing(true)}
      tabIndex={0}
      role="textbox"
      aria-label={isEmpty ? `${placeholder} — click to edit` : `${value} — click to edit`}
    >
      {value || placeholder}
    </span>
  );
}

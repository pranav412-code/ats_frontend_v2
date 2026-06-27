import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { InlineEditableText } from '../InlineEditableText';
import { StructuredDateInput } from './StructuredDateInput';

export interface ObjectCardItem {
  id?: string;
  [key: string]: any;
}

interface Props {
  title: string;
  items: ObjectCardItem[];
  /** Field keys for primary / secondary / date positions. */
  fields: {
    primary: string;     // e.g. 'name' for cert, 'title' for award
    secondary?: string;  // e.g. 'issuer'
    date?: string;       // e.g. 'date'
  };
  placeholders: {
    primary: string;
    secondary?: string;
    date?: string;
  };
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onFieldUpdate: (index: number, field: string, value: string) => void;
  onEditStateChange?: (isEditing: boolean) => void;
  autoFocusItemId?: string | null;
}

/**
 * Card-list layout for object-array sections with {name|title, issuer, date}
 * shape — certifications + awards. Each card: primary line (bold) +
 * secondary line (italic small) + right-aligned date. Trash on hover.
 */
export function ObjectCardSection({
  title,
  items,
  fields,
  placeholders,
  addLabel,
  onAdd,
  onRemove,
  onFieldUpdate,
  onEditStateChange,
  autoFocusItemId,
}: Props) {
  const isEmpty = items.length === 0;

  return (
    <div className="font-sans">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        {title}
      </h3>

      {isEmpty ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full text-left inline-flex items-center justify-center gap-2 text-sm italic text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="group/item relative px-7 sm:px-0">
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-1 sm:-right-6 top-1 translate-x-0 sm:translate-x-2 opacity-60 sm:opacity-0 sm:group-hover/item:translate-x-0 sm:group-hover/item:opacity-100 transition-all text-zinc-400 hover:text-red-500 p-1"
                title="Delete"
                aria-label={`Delete ${item[fields.primary] || placeholders.primary}`}
              >
                <Trash2 size={14} />
              </button>
              <div className="flex justify-between items-baseline gap-3">
                <InlineEditableText
                  value={item[fields.primary] || ''}
                  onSave={(v) => onFieldUpdate(i, fields.primary, v)}
                  className="font-medium flex-1"
                  placeholder={placeholders.primary}
                  onEditStateChange={onEditStateChange}
                  startEditing={item.id === autoFocusItemId}
                />
                {fields.date && (
                  <StructuredDateInput
                    value={item[fields.date] || ''}
                    onSave={(v) => onFieldUpdate(i, fields.date!, v)}
                    className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-20"
                    placeholder={placeholders.date || 'Date'}
                    isRange={false}
                    onEditStateChange={onEditStateChange}
                  />
                )}
              </div>
              {fields.secondary && (
                <InlineEditableText
                  value={item[fields.secondary] || ''}
                  onSave={(v) => onFieldUpdate(i, fields.secondary!, v)}
                  className="text-sm text-zinc-600 dark:text-zinc-400 italic block mt-0.5"
                  placeholder={placeholders.secondary || ''}
                  onEditStateChange={onEditStateChange}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 px-2 py-1 mt-1 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-md transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <Plus size={12} />
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

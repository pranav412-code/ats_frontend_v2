import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { InlineEditableText } from '../InlineEditableText';

interface Props {
  title: string;
  items: string[];
  placeholder?: string;
  itemPlaceholder?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
  onAddNewValue?: (value: string) => void;
  onEditStateChange?: (isEditing: boolean) => void;
}

/**
 * Reusable pill grid for string-array sections: skills, hobbies, interests,
 * volunteer activities. Each item is inline-editable with hover-remove.
 * Features an inline input form for adding items directly with Enter/Plus.
 */
export function StringPillSection({
  title,
  items,
  placeholder,
  itemPlaceholder = 'Item',
  onAdd,
  onRemove,
  onUpdate,
  onAddNewValue,
  onEditStateChange,
}: Props) {
  const [newVal, setNewVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newVal.trim();
    if (!trimmed) return;
    if (onAddNewValue) {
      onAddNewValue(trimmed);
    } else {
      // Fallback: caller did not supply onAddNewValue. Add a blank slot then
      // populate it via onUpdate so the typed value is not lost.
      onAdd();
      const newIndex = items.length;
      // Defer to next tick so the new slot exists in state before update.
      setTimeout(() => onUpdate(newIndex, trimmed), 0);
    }
    setNewVal('');
  };

  return (
    <div className="font-sans">
      {title && (
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">
          {title}
        </h3>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-2.5 items-center">
        {items.map((item, i) => (
          <div key={i} className="inline-flex group/pill relative">
            <InlineEditableText
              value={item || ''}
              onSave={(v) => {
                if (v.trim() === '') {
                  onRemove(i);
                } else {
                  onUpdate(i, v);
                }
              }}
              className="text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300 transition-colors group-hover/pill:bg-zinc-200/50 dark:group-hover/pill:bg-zinc-700/50"
              placeholder={itemPlaceholder}
              onEditStateChange={onEditStateChange}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -top-1 -right-1 opacity-100 sm:opacity-0 sm:group-hover/pill:opacity-100 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-all scale-100 sm:scale-75 sm:group-hover/pill:scale-100"
              title="Remove"
              aria-label={`Remove ${item || itemPlaceholder}`}
            >
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}

        <form onSubmit={handleSubmit} className="inline-flex items-center gap-1 relative">
          <input
            type="text"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onFocus={() => onEditStateChange?.(true)}
            onBlur={() => onEditStateChange?.(false)}
            placeholder={placeholder || `Add ${title.toLowerCase()}...`}
            className="text-sm bg-transparent border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none px-3 py-1 rounded-full w-32 transition-colors font-sans"
          />
          <button
            type="submit"
            disabled={!newVal.trim()}
            className="absolute right-1 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-0 disabled:pointer-events-none bg-white dark:bg-zinc-900 rounded-full"
            aria-label={`Add ${title.toLowerCase()}`}
          >
            <Plus size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

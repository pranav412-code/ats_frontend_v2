import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Pencil } from 'lucide-react';

interface InlineEditableTextProps {
  value: string;
  onSave: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent, currentValue: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  /** Input type — affects keyboard layout on mobile. */
  type?: 'text' | 'email' | 'tel' | 'url';
  /** Auto-select all text on focus. Default true for single-line. */
  autoSelect?: boolean;
  /** Max characters (display only, not enforced). */
  maxLength?: number;
  /** Called when user pastes multi-line text. Caller can split into multiple bullets. */
  onMultilinePaste?: (lines: string[]) => boolean;
  /** Notifies parent component when editing state changes. */
  onEditStateChange?: (isEditing: boolean) => void;
  /** Whether to start in editing mode automatically on mount. */
  startEditing?: boolean;
}

export function InlineEditableText({
  value,
  onSave,
  onKeyDown,
  className,
  multiline = false,
  placeholder = 'Empty',
  type = 'text',
  autoSelect,
  maxLength,
  onMultilinePaste,
  onEditStateChange,
  startEditing,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(startEditing || false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    onEditStateChange?.(isEditing);
  }, [isEditing, onEditStateChange]);

  useEffect(() => {
    // Only sync from external `value` while not actively editing.
    // Prevents live-score / store refresh from clobbering typed text mid-edit.
    if (!isEditing) setCurrentValue(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (!isEditing || !inputRef.current) return;
    inputRef.current.focus();

    if (multiline) {
      // Auto-resize textarea on enter edit
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }

    const shouldSelect = autoSelect ?? !multiline;
    if (shouldSelect) {
      inputRef.current.select();
    } else {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing, multiline, autoSelect]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (multiline) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          e.preventDefault();
          handleSave();
        } else {
          // Auto-bullet logic
          const target = e.target as HTMLTextAreaElement;
          const val = target.value;
          const start = target.selectionStart;
          const end = target.selectionEnd;

          if (start === end) {
            const upToCursor = val.substring(0, start);
            const lines = upToCursor.split('\n');
            const currentLine = lines[lines.length - 1];

            const match = currentLine.match(/^([•\-\*]\s*)/);
            if (match) {
              e.preventDefault();
              const prefix = match[1];

              // If the current line is just a bullet, remove it instead of adding a new one
              if (currentLine.trim() === prefix.trim()) {
                const before = val.substring(0, start - currentLine.length);
                const after = val.substring(start);
                setCurrentValue(before + after);
                requestAnimationFrame(() => {
                  if (inputRef.current) {
                    (inputRef.current as HTMLTextAreaElement).setSelectionRange(before.length, before.length);
                  }
                });
              } else {
                // Otherwise add a new line with the same bullet
                const before = val.substring(0, start);
                const after = val.substring(start);
                setCurrentValue(before + '\n' + prefix + after);
                requestAnimationFrame(() => {
                  if (inputRef.current) {
                    const newPos = before.length + 1 + prefix.length;
                    (inputRef.current as HTMLTextAreaElement).setSelectionRange(newPos, newPos);
                  }
                });
              }
            }
          }
        }
      } else if (!e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
    // Let Tab proceed naturally, which will trigger onBlur and handleSave
    if (onKeyDown) {
      onKeyDown(e, currentValue);
    }
  };

  const isEmpty = !value || !value.trim();

  if (isEditing) {
    const commonProps = {
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
        if (multiline && e.target instanceof HTMLTextAreaElement) {
          e.target.style.height = 'auto';
          e.target.style.height =
            Math.min(e.target.scrollHeight, 320) + 'px';
        }
      },
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      onPaste: (e: React.ClipboardEvent) => {
        if (!onMultilinePaste) return;
        const pasted = e.clipboardData.getData('text');
        const lines = pasted
          .split(/\r?\n/)
          .map((l) => l.replace(/^[\s•◦‣⁃·▪►\-*]+/, '').trim())
          .filter((l) => l.length > 0);
        if (lines.length > 1) {
          e.preventDefault();
          const target = e.target as HTMLInputElement | HTMLTextAreaElement;
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const val = target.value;
          const beforeText = val.slice(0, start);
          const afterText = val.slice(end);

          const mergedLines = [
            beforeText + lines[0],
            ...lines.slice(1, -1),
            lines[lines.length - 1] + afterText
          ];

          if (onMultilinePaste(mergedLines)) {
            setIsEditing(false);
          }
        }
      },
      placeholder,
      maxLength,
      className: cn(
        'w-full h-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-sm shadow-sm',
        'px-1.5 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200/50 dark:focus:ring-zinc-700/50',
        'text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600',
        'placeholder:italic placeholder:font-serif',
        'font-inherit block transition-all duration-200 resize-none'
      ),
    };

    return (
      <span className={cn("relative inline-block w-full align-baseline -mx-1.5 -my-1", className)}>
        {multiline ? (
          <textarea
            {...commonProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={1}
            style={{ overflow: 'auto', resize: 'none', maxHeight: 320 }}
          />
        ) : (
          <input
            {...commonProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'url' ? 'url' : 'text'}
          />
        )}
        {/* Keyboard hint & toolbar */}
        <div
          className={cn(
            'absolute top-full left-0 mt-1 z-50 flex items-center gap-2',
            'opacity-0 transition-opacity',
            isEditing && 'opacity-100'
          )}
        >
          <span
            className={cn(
              'select-none pointer-events-none',
              'text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500',
              'whitespace-nowrap bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-zinc-200 dark:border-zinc-800'
            )}
          >
            {multiline ? 'ctrl+↵ save' : '↵ save'} · esc cancel{multiline ? ' · ↵ newline' : ''}
          </span>
          
          {multiline && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                const target = inputRef.current as HTMLTextAreaElement;
                if (!target) return;
                const val = target.value;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                
                if (start === end) {
                  const lines = val.split('\n');
                  let lineIndex = 0;
                  let charCount = 0;
                  for (let i = 0; i < lines.length; i++) {
                    const len = lines[i].length + 1;
                    if (charCount + len > start || i === lines.length - 1) {
                      lineIndex = i;
                      break;
                    }
                    charCount += len;
                  }
                  
                  const line = lines[lineIndex];
                  const hasBullet = /^([•\-\*]\s*)/.test(line);
                  let diff = 0;
                  if (hasBullet) {
                    const prefix = line.match(/^([•\-\*]\s*)/)![1];
                    lines[lineIndex] = line.substring(prefix.length);
                    diff = -prefix.length;
                  } else {
                    lines[lineIndex] = '• ' + line;
                    diff = 2;
                  }
                  
                  setCurrentValue(lines.join('\n'));
                  requestAnimationFrame(() => {
                     target.setSelectionRange(start + diff, end + diff);
                     target.focus();
                  });
                }
              }}
              className="pointer-events-auto px-1.5 py-0.5 bg-white/90 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded shadow-sm border border-zinc-200 dark:border-zinc-800 text-[9px] font-mono uppercase tracking-[0.2em] transition-colors cursor-pointer backdrop-blur-sm"
            >
              • Bullet
            </button>
          )}
        </div>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'group relative cursor-text inline-block align-baseline',
        'min-w-[3rem] min-h-[1.5rem] px-1.5 py-1 -mx-1.5 -my-1 rounded-sm',
        'border transition-all duration-200',
        'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
        isEmpty
          ? 'border-zinc-400 dark:border-zinc-600 border-dotted italic text-zinc-500 dark:text-zinc-500'
          : 'border-transparent',
        className
      )}
      onClick={() => setIsEditing(true)}
      onFocus={() => setIsEditing(true)}
      tabIndex={0}
      role="textbox"
      aria-label={isEmpty ? `${placeholder} — click to edit` : `${value} — click to edit`}
    >
      <span className={cn(isEmpty && 'opacity-70')}>
        {value || placeholder}
      </span>
      {!isEmpty && (
        <span className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-40 transition-opacity text-zinc-500 pointer-events-none">
          <Pencil size={12} />
        </span>
      )}
    </span>
  );
}

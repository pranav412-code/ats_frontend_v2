import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Edit2 } from 'lucide-react';

interface InlineEditableTextProps {
  value: string;
  onSave: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent, currentValue: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

export function InlineEditableText({ value, onSave, onKeyDown, className, multiline = false, placeholder = "Empty..." }: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
      
      if (multiline) {
        // Auto-resize textarea
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue.trim() !== value) {
      onSave(currentValue);
    } else {
      setCurrentValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value);
    }
    if (onKeyDown) {
      onKeyDown(e, currentValue);
    }
  };

  if (isEditing) {
    const commonProps = {
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
        if (multiline && e.target instanceof HTMLTextAreaElement) {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }
      },
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      placeholder,
      className: cn(
        "w-full bg-zinc-50 dark:bg-zinc-800/80 border border-blue-400 dark:border-blue-500 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-inherit block",
        className
      )
    };

    if (multiline) {
      return (
        <textarea
          {...commonProps}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={1}
          style={{ overflow: 'hidden', resize: 'none' }}
        />
      );
    }

    return <input {...commonProps} ref={inputRef as React.RefObject<HTMLInputElement>} type="text" />;
  }

  return (
    <div 
      className={cn(
        "group relative cursor-text rounded -mx-1.5 px-1.5 py-0.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 inline-block min-w-8 min-h-6",
        className,
        !value && "opacity-50 italic"
      )}
      onClick={() => setIsEditing(true)}
    >
      <span>{value || placeholder}</span>
      <div className="absolute top-1/2 -translate-y-1/2 -right-5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400">
        <Edit2 size={12} />
      </div>
    </div>
  );
}

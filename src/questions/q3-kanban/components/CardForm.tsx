import { useId, useRef, useState } from 'react';
import type { CardDraft } from '../types';

const EMPTY_DRAFT: CardDraft = { title: '', description: '' };

export interface CardFormProps {
  initial?: CardDraft;
  submitLabel: string;
  /** Accessible name for the form, e.g. "Add a card to To do". */
  label: string;
  onSubmit: (draft: CardDraft) => void;
  onCancel: () => void;
}

export function CardForm({
  initial = EMPTY_DRAFT,
  submitLabel,
  label,
  onSubmit,
  onCancel,
}: CardFormProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      aria-label={label}
      noValidate
      className="space-y-2 rounded-md border border-slate-300 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) {
          setError('Title is required');
          titleRef.current?.focus();
          return;
        }
        onSubmit({ title: trimmed, description: description.trim() });
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div>
        <label htmlFor={titleId} className="block text-sm font-medium">
          Title
        </label>
        <input
          ref={titleRef}
          id={titleId}
          autoFocus
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (event.target.value.trim()) setError(null);
          }}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 aria-invalid:border-red-600"
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={descriptionId} className="block text-sm font-medium">
          Description <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

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
      className="card space-y-3 p-3"
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
        <label htmlFor={titleId} className="label">
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
          placeholder="What needs doing?"
          className="input aria-invalid:focus:border-rose-500 aria-invalid:focus:ring-rose-100"
        />
        {error && (
          <p id={errorId} className="field-error">
            {error}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={descriptionId} className="label">
          Description <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Add more detail"
          className="input resize-y"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

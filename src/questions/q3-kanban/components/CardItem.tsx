import { useId } from 'react';
import type { Card, CardDraft } from '../types';
import { CardForm } from './CardForm';

export interface CardItemProps {
  card: Card;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: CardDraft) => void;
  onDelete: () => void;
}

const actionClass = 'rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200';

export function CardItem({
  card,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: CardItemProps) {
  const titleId = useId();

  if (isEditing) {
    return (
      <li data-card-id={card.id}>
        <CardForm
          label={`Edit ${card.title}`}
          initial={card}
          submitLabel="Save"
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    <li data-card-id={card.id} className="relative">
      <article
        aria-labelledby={titleId}
        className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
      >
        <h3 id={titleId} className="font-medium break-words">
          {card.title}
        </h3>
        {card.description && (
          <p className="mt-1 text-sm whitespace-pre-line break-words text-slate-600">
            {card.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          <button type="button" data-focus="edit" onClick={onEdit} className={actionClass}>
            Edit<span className="sr-only"> {card.title}</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${actionClass} text-red-700 hover:bg-red-50`}
          >
            Delete<span className="sr-only"> {card.title}</span>
          </button>
        </div>
      </article>
    </li>
  );
}

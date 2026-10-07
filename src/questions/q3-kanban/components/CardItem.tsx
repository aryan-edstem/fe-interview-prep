import { useId, type ReactNode } from 'react';
import type { Card, CardDraft } from '../types';
import { CardForm } from './CardForm';

export interface CardItemProps {
  card: Card;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: CardDraft) => void;
  onDelete: () => void;
  isDragging: boolean;
  /** Draws the drop position line above or below this card while dragging. */
  dropIndicator: 'before' | 'after' | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  /** Keyboard-operable move controls, rendered with the card's other actions. */
  moveMenu: ReactNode;
}

const actionClass = 'rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200';

export function CardItem({
  card,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isDragging,
  dropIndicator,
  onDragStart,
  onDragEnd,
  moveMenu,
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
    <li
      data-card-id={card.id}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="relative"
    >
      {dropIndicator && (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 h-1 rounded bg-blue-500 ${
            dropIndicator === 'before' ? '-top-1.5' : '-bottom-1.5'
          }`}
        />
      )}
      <article
        aria-labelledby={titleId}
        className={`cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm ${
          isDragging ? 'opacity-50' : ''
        }`}
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
            Edit <span className="sr-only">{card.title}</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${actionClass} text-red-700 hover:bg-red-50`}
          >
            Delete <span className="sr-only">{card.title}</span>
          </button>
          {moveMenu}
        </div>
      </article>
    </li>
  );
}

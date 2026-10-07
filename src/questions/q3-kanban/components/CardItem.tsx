import { useId, type ReactNode } from 'react';
import type { Card, CardDraft } from '../types';
import { CardForm } from './CardForm';
import { PencilIcon, TrashIcon } from './icons';

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
          className={`absolute inset-x-1 z-10 h-1 rounded-full bg-brand-500 ring-2 ring-brand-100 ${
            dropIndicator === 'before' ? '-top-1.5' : '-bottom-1.5'
          }`}
        />
      )}
      <article
        aria-labelledby={titleId}
        className={`card group/card cursor-grab p-3 transition active:cursor-grabbing ${
          isDragging
            ? 'rotate-1 border-brand-200 opacity-50 shadow-card-hover'
            : 'hover:border-slate-300 hover:shadow-card-hover'
        }`}
      >
        <div className="flex items-start gap-2">
          <h3 id={titleId} className="min-w-0 flex-1 pt-1 text-sm font-semibold break-words">
            {card.title}
          </h3>
          <div className="-mt-0.5 -mr-1 flex shrink-0 items-center">
            <button
              type="button"
              data-focus="edit"
              onClick={onEdit}
              title="Edit"
              className="btn btn-ghost btn-sm btn-icon"
            >
              <PencilIcon />
              <span className="sr-only">Edit {card.title}</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              className="btn btn-ghost btn-sm btn-icon hover:bg-rose-50 hover:text-rose-600"
            >
              <TrashIcon />
              <span className="sr-only">Delete {card.title}</span>
            </button>
            {moveMenu}
          </div>
        </div>
        {card.description && (
          <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line break-words text-slate-500">
            {card.description}
          </p>
        )}
      </article>
    </li>
  );
}

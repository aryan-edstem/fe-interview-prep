import { useId, useRef, useState, type ReactNode } from 'react';
import type { Card, CardDraft, ColumnId, Column as ColumnType } from '../types';
import { slotAt } from '../dnd';
import { CardForm } from './CardForm';

/** Per-column accent: a coloured top edge, a dot in the header and a matching count badge. */
const ACCENTS: Record<ColumnId, { edge: string; dot: string; badge: string }> = {
  todo: { edge: 'border-t-slate-400', dot: 'bg-slate-400', badge: 'badge-neutral' },
  inProgress: { edge: 'border-t-brand-500', dot: 'bg-brand-500', badge: 'badge-brand' },
  done: { edge: 'border-t-emerald-500', dot: 'bg-emerald-500', badge: 'badge-success' },
};

export interface ColumnProps {
  column: ColumnType;
  cards: Card[];
  onAddCard: (draft: CardDraft) => void;
  renderCard: (card: Card, index: number) => ReactNode;
  /** True while a card is being dragged anywhere on the board. */
  isDragActive: boolean;
  /** Slot where the drop indicator is shown in this column, or null. */
  dropSlot: number | null;
  onDragOverSlot: (slot: number) => void;
  onDragLeave: () => void;
  onDropAt: (slot: number) => void;
}

export function Column({
  column,
  cards,
  onAddCard,
  renderCard,
  isDragActive,
  dropSlot,
  onDragOverSlot,
  onDragLeave,
  onDropAt,
}: ColumnProps) {
  const headingId = useId();
  const accent = ACCENTS[column.id];
  const count = cards.length;
  const [isAdding, setIsAdding] = useState(false);
  // Bumped after each add so the form remounts empty and refocuses its title for the next card.
  const [formKey, setFormKey] = useState(0);
  const focusAddButton = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);

  function slotFor(clientY: number): number {
    const items = Array.from(listRef.current?.children ?? []).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.cardId !== undefined,
    );
    return slotAt(items, clientY);
  }

  function closeForm() {
    focusAddButton.current = true;
    setIsAdding(false);
  }

  return (
    <section
      aria-labelledby={headingId}
      data-column-id={column.id}
      className={`flex min-w-0 flex-col rounded-xl border border-t-4 border-slate-200 p-3 transition ${
        accent.edge
      } ${dropSlot !== null ? 'bg-brand-50/70 ring-2 ring-brand-200' : 'bg-slate-100/70'}`}
      onDragOver={(event) => {
        if (!isDragActive) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOverSlot(slotFor(event.clientY));
      }}
      onDragLeave={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        onDragLeave();
      }}
      onDrop={(event) => {
        if (!isDragActive) return;
        event.preventDefault();
        onDropAt(slotFor(event.clientY));
      }}
    >
      <h2 id={headingId} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
        <span aria-hidden="true" className={`size-2 rounded-full ${accent.dot}`} />
        {column.title}{' '}
        <span className={`badge ${accent.badge} ml-auto`}>
          {count} <span className="sr-only">{count === 1 ? 'card' : 'cards'}</span>
        </span>
      </h2>
      {count === 0 ? (
        <div className="empty-state py-8">
          <p className="font-medium text-slate-600">No cards yet</p>
          <p className="text-xs">Drag a card here or add a new one.</p>
        </div>
      ) : (
        <ul ref={listRef} className="flex flex-col gap-2.5">
          {cards.map((card, index) => renderCard(card, index))}
        </ul>
      )}
      <div className="mt-3">
        {isAdding ? (
          <CardForm
            key={formKey}
            label={`Add a card to ${column.title}`}
            submitLabel="Add card"
            onSubmit={(draft) => {
              onAddCard(draft);
              setFormKey((key) => key + 1);
            }}
            onCancel={closeForm}
          />
        ) : (
          <button
            type="button"
            ref={(button) => {
              if (button && focusAddButton.current) {
                focusAddButton.current = false;
                button.focus();
              }
            }}
            data-focus="add"
            onClick={() => setIsAdding(true)}
            className="btn btn-ghost w-full justify-start text-slate-500"
          >
            <span className="text-base leading-none">+</span> Add card{' '}
            <span className="sr-only">to {column.title}</span>
          </button>
        )}
      </div>
    </section>
  );
}

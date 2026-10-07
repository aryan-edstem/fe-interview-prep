import { useId, useRef, useState, type ReactNode } from 'react';
import type { Card, CardDraft, Column as ColumnType } from '../types';
import { slotAt } from '../dnd';
import { CardForm } from './CardForm';

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
      className={`flex min-w-0 flex-col rounded-lg bg-slate-100 p-3 ${
        dropSlot !== null ? 'ring-2 ring-blue-400' : ''
      }`}
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
      <h2 id={headingId} className="mb-3 flex items-center justify-between font-semibold">
        {column.title}{' '}
        <span className="rounded-full bg-white px-2 py-0.5 text-sm text-slate-700">
          {count} <span className="sr-only">{count === 1 ? 'card' : 'cards'}</span>
        </span>
      </h2>
      {count === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No cards yet</p>
      ) : (
        <ul ref={listRef} className="space-y-2">
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
            onClick={() => setIsAdding(true)}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-200"
          >
            + Add card <span className="sr-only">to {column.title}</span>
          </button>
        )}
      </div>
    </section>
  );
}

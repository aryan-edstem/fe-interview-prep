import { useId, useRef, useState, type ReactNode } from 'react';
import type { Card, CardDraft, Column as ColumnType } from '../types';
import { CardForm } from './CardForm';

export interface ColumnProps {
  column: ColumnType;
  cards: Card[];
  onAddCard: (draft: CardDraft) => void;
  renderCard: (card: Card, index: number) => ReactNode;
}

export function Column({ column, cards, onAddCard, renderCard }: ColumnProps) {
  const headingId = useId();
  const count = cards.length;
  const [isAdding, setIsAdding] = useState(false);
  // Bumped after each add so the form remounts empty and refocuses its title for the next card.
  const [formKey, setFormKey] = useState(0);
  const focusAddButton = useRef(false);

  function closeForm() {
    focusAddButton.current = true;
    setIsAdding(false);
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col rounded-lg bg-slate-100 p-3"
    >
      <h2 id={headingId} className="mb-3 flex items-center justify-between font-semibold">
        {column.title}{' '}
        <span className="rounded-full bg-white px-2 py-0.5 text-sm text-slate-700">
          {count}
          <span className="sr-only"> {count === 1 ? 'card' : 'cards'}</span>
        </span>
      </h2>
      {count === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No cards yet</p>
      ) : (
        <ul className="space-y-2">{cards.map((card, index) => renderCard(card, index))}</ul>
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
            + Add card<span className="sr-only"> to {column.title}</span>
          </button>
        )}
      </div>
    </section>
  );
}

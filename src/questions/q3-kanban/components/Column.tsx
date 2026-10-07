import { useId } from 'react';
import type { Card, Column as ColumnType } from '../types';
import { CardItem } from './CardItem';

export interface ColumnProps {
  column: ColumnType;
  cards: Card[];
}

export function Column({ column, cards }: ColumnProps) {
  const headingId = useId();
  const count = cards.length;

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
        <ul className="space-y-2">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </ul>
      )}
    </section>
  );
}

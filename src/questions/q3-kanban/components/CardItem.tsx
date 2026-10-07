import { useId } from 'react';
import type { Card } from '../types';

export interface CardItemProps {
  card: Card;
}

export function CardItem({ card }: CardItemProps) {
  const titleId = useId();
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
      </article>
    </li>
  );
}

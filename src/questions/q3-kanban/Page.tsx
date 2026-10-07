import { COLUMNS } from './columns';
import { Column } from './components/Column';
import { useBoard } from './hooks/useBoard';
import type { Card } from './types';

export default function KanbanPage() {
  const { board } = useBoard();

  const cardsIn = (ids: readonly string[]): Card[] =>
    ids.flatMap((id) => {
      const card = board.cards[id];
      return card ? [card] : [];
    });

  return (
    <section className="max-w-6xl">
      <h1 className="mb-2 text-2xl font-bold">Kanban board</h1>
      <p className="mb-6 text-slate-600">
        Drag cards to move them, or use each card&apos;s Move button with the keyboard.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <Column key={column.id} column={column} cards={cardsIn(board.columns[column.id])} />
        ))}
      </div>
    </section>
  );
}

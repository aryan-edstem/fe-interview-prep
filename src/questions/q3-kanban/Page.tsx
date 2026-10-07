import { useEffect, useRef, useState } from 'react';
import { COLUMNS, columnTitle } from './columns';
import { CardItem } from './components/CardItem';
import { Column } from './components/Column';
import { dropToMoveIndex, isNoopDrop } from './dnd';
import { locateCard } from './hooks/boardReducer';
import { useBoard, type MoveResult } from './hooks/useBoard';
import type { Card, ColumnId, DeletedCard } from './types';

/** Which control inside a card should receive focus after the next render. */
interface FocusRequest {
  cardId: string;
  target: string;
}

interface DropTarget {
  column: ColumnId;
  slot: number;
}

function moveMessage({ card, column, index, total }: MoveResult): string {
  return `Moved "${card.title}" to ${columnTitle(column)}, position ${index + 1} of ${total}.`;
}

export default function KanbanPage() {
  const { board, addCard, editCard, deleteCard, restoreCard, moveCard } = useBoard();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<DeletedCard | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragFrom = draggingId ? locateCard(board, draggingId) : null;
  // Hide the indicator where a drop would not move the card.
  const visibleDrop =
    dropTarget && dragFrom && !isNoopDrop(dragFrom, dropTarget.column, dropTarget.slot)
      ? dropTarget
      : null;

  // Cards remount when they change column or leave edit mode, so focus is restored explicitly.
  useEffect(() => {
    if (!focusRequest) return;
    const cardEl = Array.from(
      boardRef.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? [],
    ).find((el) => el.dataset.cardId === focusRequest.cardId);
    const preferred = cardEl?.querySelector<HTMLButtonElement>(
      `[data-focus="${focusRequest.target}"]`,
    );
    const fallback = cardEl?.querySelector<HTMLElement>('[data-focus="fallback"]');
    (preferred && !preferred.disabled ? preferred : fallback)?.focus();
  }, [focusRequest]);

  const cardsIn = (ids: readonly string[]): Card[] =>
    ids.flatMap((id) => {
      const card = board.cards[id];
      return card ? [card] : [];
    });

  function handleDelete(card: Card) {
    const removed = deleteCard(card.id);
    if (!removed) return;
    if (editingId === card.id) setEditingId(null);
    setDeleted(removed);
    setAnnouncement(`Deleted "${card.title}".`);
  }

  function endDrag() {
    setDraggingId(null);
    setDropTarget(null);
  }

  function handleDrop(column: ColumnId, slot: number) {
    const id = draggingId;
    const from = id ? locateCard(board, id) : null;
    endDrag();
    if (!id || !from) return;
    const result = moveCard(id, column, dropToMoveIndex(from, column, slot));
    if (result) setAnnouncement(moveMessage(result));
  }

  function handleUndo() {
    if (!deleted) return;
    restoreCard(deleted);
    setDeleted(null);
    setAnnouncement(`Restored "${deleted.card.title}".`);
    setFocusRequest({ cardId: deleted.card.id, target: 'edit' });
  }

  function dropIndicatorFor(column: ColumnId, index: number, total: number) {
    if (visibleDrop?.column !== column) return null;
    if (visibleDrop.slot === index) return 'before';
    if (visibleDrop.slot === total && index === total - 1) return 'after';
    return null;
  }

  return (
    <section className="max-w-6xl">
      <h1 className="mb-2 text-2xl font-bold">Kanban board</h1>
      <p className="mb-6 text-slate-600">
        Drag cards to move them, or use each card&apos;s Move button with the keyboard.
      </p>
      <div ref={boardRef} className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={cardsIn(board.columns[column.id])}
            onAddCard={(draft) => {
              const card = addCard(column.id, draft);
              setAnnouncement(`Added "${card.title}" to ${column.title}.`);
            }}
            isDragActive={draggingId !== null}
            dropSlot={visibleDrop?.column === column.id ? visibleDrop.slot : null}
            onDragOverSlot={(slot) => {
              if (dropTarget?.column !== column.id || dropTarget.slot !== slot) {
                setDropTarget({ column: column.id, slot });
              }
            }}
            onDragLeave={() => {
              if (dropTarget?.column === column.id) setDropTarget(null);
            }}
            onDropAt={(slot) => handleDrop(column.id, slot)}
            renderCard={(card, index) => (
              <CardItem
                key={card.id}
                card={card}
                isEditing={editingId === card.id}
                onEdit={() => setEditingId(card.id)}
                onCancelEdit={() => {
                  setEditingId(null);
                  setFocusRequest({ cardId: card.id, target: 'edit' });
                }}
                onSave={(draft) => {
                  editCard(card.id, draft);
                  setEditingId(null);
                  setAnnouncement(`Saved "${draft.title}".`);
                  setFocusRequest({ cardId: card.id, target: 'edit' });
                }}
                onDelete={() => handleDelete(card)}
                isDragging={draggingId === card.id}
                dropIndicator={dropIndicatorFor(column.id, index, board.columns[column.id].length)}
                onDragStart={() => setDraggingId(card.id)}
                onDragEnd={endDrag}
              />
            )}
          />
        ))}
      </div>
      {deleted && (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
          <span>Deleted &ldquo;{deleted.card.title}&rdquo;.</span>
          <button
            key={deleted.card.id}
            type="button"
            autoFocus
            onClick={handleUndo}
            className="rounded px-2 py-1 font-medium underline hover:bg-slate-700"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setDeleted(null)}
            className="ml-auto rounded px-2 py-1 hover:bg-slate-700"
          >
            Dismiss
          </button>
        </div>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}

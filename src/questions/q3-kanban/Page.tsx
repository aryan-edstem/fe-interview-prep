import { useEffect, useRef, useState } from 'react';
import { COLUMN_IDS, COLUMNS, columnTitle } from './columns';
import { CardItem } from './components/CardItem';
import { Column } from './components/Column';
import { MoveMenu, type MoveDirection, type MoveOptions } from './components/MoveMenu';
import { dropToMoveIndex, isNoopDrop } from './dnd';
import { locateCard } from './hooks/boardReducer';
import { useBoard, type MoveResult } from './hooks/useBoard';
import type { Card, CardLocation, ColumnId, DeletedCard } from './types';

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

/** Where a keyboard move in `direction` would send a card at `from` (before clamping). */
function moveTarget(from: CardLocation, direction: MoveDirection) {
  const columnIndex = COLUMN_IDS.indexOf(from.column);
  switch (direction) {
    case 'up':
      return { column: from.column, index: from.index - 1 };
    case 'down':
      return { column: from.column, index: from.index + 1 };
    case 'left': {
      const column = COLUMN_IDS[columnIndex - 1];
      return column ? { column, index: from.index } : null;
    }
    case 'right': {
      const column = COLUMN_IDS[columnIndex + 1];
      return column ? { column, index: from.index } : null;
    }
  }
}

function moveOptions(from: CardLocation, total: number): MoveOptions {
  const left = moveTarget(from, 'left');
  const right = moveTarget(from, 'right');
  return {
    up: from.index > 0 ? 'Move up' : null,
    down: from.index < total - 1 ? 'Move down' : null,
    left: left ? `Move to ${columnTitle(left.column)}` : null,
    right: right ? `Move to ${columnTitle(right.column)}` : null,
  };
}

export default function KanbanPage() {
  const { board, addCard, editCard, deleteCard, restoreCard, moveCard } = useBoard();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<DeletedCard | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
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
    if (moveMenuFor === card.id) setMoveMenuFor(null);
    setDeleted(removed);
    setAnnouncement(`Deleted "${card.title}".`);
  }

  function handleKeyboardMove(card: Card, direction: MoveDirection) {
    const from = locateCard(board, card.id);
    const to = from ? moveTarget(from, direction) : null;
    if (!to) return;
    const result = moveCard(card.id, to.column, to.index);
    if (!result) return;
    setAnnouncement(moveMessage(result));
    // The card may have remounted in another column; keep focus on the same move button.
    setFocusRequest({ cardId: card.id, target: direction });
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

  const totalCards = Object.keys(board.cards).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Question 3</p>
          <h1 className="page-title">Kanban board</h1>
          <p className="page-description">
            Drag cards to move them, or use each card&apos;s Move button with the keyboard. Your
            board is saved in this browser.
          </p>
        </div>
        <p className="badge badge-neutral">
          {totalCards} {totalCards === 1 ? 'card' : 'cards'} in total
        </p>
      </header>
      <div ref={boardRef} className="grid items-start gap-4 md:grid-cols-3">
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
                moveMenu={
                  <MoveMenu
                    cardTitle={card.title}
                    isOpen={moveMenuFor === card.id}
                    options={moveOptions(
                      { column: column.id, index },
                      board.columns[column.id].length,
                    )}
                    onToggle={() => setMoveMenuFor((open) => (open === card.id ? null : card.id))}
                    onClose={() => {
                      setMoveMenuFor(null);
                      setFocusRequest({ cardId: card.id, target: 'fallback' });
                    }}
                    onMove={(direction) => handleKeyboardMove(card, direction)}
                  />
                }
              />
            )}
          />
        ))}
      </div>
      {deleted && (
        <div className="alert alert-info fixed inset-x-4 bottom-4 z-30 mx-auto max-w-md shadow-card-hover">
          <span className="min-w-0 truncate">
            Deleted <strong className="font-semibold">&ldquo;{deleted.card.title}&rdquo;</strong>
          </span>
          <span className="flex shrink-0 gap-1">
            <button
              key={deleted.card.id}
              type="button"
              autoFocus
              onClick={handleUndo}
              className="btn btn-primary btn-sm"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setDeleted(null)}
              className="btn btn-ghost btn-sm text-brand-700 hover:bg-brand-100"
            >
              Dismiss
            </button>
          </span>
        </div>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

import { useEffect, useReducer } from 'react';
import type { BoardState, Card, CardDraft, ColumnId, DeletedCard } from '../types';
import { boardReducer, locateCard } from './boardReducer';
import { loadBoard, saveBoard } from './boardStorage';

/** Where a card ended up after a move, for announcements ("position 2 of 3"). */
export interface MoveResult {
  card: Card;
  column: ColumnId;
  index: number;
  total: number;
}

function createId(): string {
  return crypto.randomUUID();
}

export function useBoard() {
  const [board, dispatch] = useReducer(boardReducer, undefined, loadBoard);

  // Sync to storage so the board survives a refresh.
  useEffect(() => {
    saveBoard(board);
  }, [board]);

  function addCard(column: ColumnId, draft: CardDraft): Card {
    const card: Card = { id: createId(), ...draft };
    dispatch({ type: 'add', card, column });
    return card;
  }

  function editCard(id: string, draft: CardDraft) {
    dispatch({ type: 'edit', id, draft });
  }

  /** Deletes a card and returns what is needed to undo it. */
  function deleteCard(id: string): DeletedCard | null {
    const card = board.cards[id];
    const location = locateCard(board, id);
    if (!card || !location) return null;
    dispatch({ type: 'delete', id });
    return { card, location };
  }

  function restoreCard({ card, location }: DeletedCard) {
    dispatch({ type: 'add', card, column: location.column, index: location.index });
  }

  /**
   * Moves a card and returns where it lands, or `null` when nothing changes. The result is
   * computed with the same pure reducer, so it always matches what React will render.
   */
  function moveCard(id: string, toColumn: ColumnId, toIndex: number): MoveResult | null {
    const card = board.cards[id];
    const next: BoardState = boardReducer(board, { type: 'move', id, toColumn, toIndex });
    if (!card || next === board) return null;
    dispatch({ type: 'move', id, toColumn, toIndex });
    const at = locateCard(next, id);
    if (!at) return null;
    return { card, column: at.column, index: at.index, total: next.columns[at.column].length };
  }

  return { board, addCard, editCard, deleteCard, restoreCard, moveCard };
}

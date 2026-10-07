import { COLUMN_IDS } from '../columns';
import type { BoardState, Card, CardDraft, CardLocation, ColumnId } from '../types';

export type BoardAction =
  /** Adds a card at `index` (default: end of the column). Also used to undo a delete. */
  | { type: 'add'; card: Card; column: ColumnId; index?: number }
  | { type: 'edit'; id: string; draft: CardDraft }
  | { type: 'delete'; id: string }
  /** `toIndex` is the position in the destination column after the card is taken out. */
  | { type: 'move'; id: string; toColumn: ColumnId; toIndex: number };

export function emptyBoard(): BoardState {
  return { cards: {}, columns: { todo: [], inProgress: [], done: [] } };
}

export function locateCard(board: BoardState, id: string): CardLocation | null {
  for (const column of COLUMN_IDS) {
    const index = board.columns[column].indexOf(id);
    if (index !== -1) return { column, index };
  }
  return null;
}

function insertAt(ids: readonly string[], index: number, id: string): string[] {
  const at = Math.max(0, Math.min(index, ids.length));
  return [...ids.slice(0, at), id, ...ids.slice(at)];
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'add': {
      const title = action.card.title.trim();
      if (!title || state.cards[action.card.id]) return state;
      const ids = state.columns[action.column];
      return {
        cards: { ...state.cards, [action.card.id]: { ...action.card, title } },
        columns: {
          ...state.columns,
          [action.column]: insertAt(ids, action.index ?? ids.length, action.card.id),
        },
      };
    }
    case 'edit': {
      const card = state.cards[action.id];
      const title = action.draft.title.trim();
      if (!card || !title) return state;
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.id]: { ...card, title, description: action.draft.description.trim() },
        },
      };
    }
    case 'delete': {
      const from = locateCard(state, action.id);
      if (!from) return state;
      const cards = { ...state.cards };
      delete cards[action.id];
      return {
        cards,
        columns: {
          ...state.columns,
          [from.column]: state.columns[from.column].filter((id) => id !== action.id),
        },
      };
    }
    case 'move': {
      const from = locateCard(state, action.id);
      if (!from) return state;
      const source = state.columns[from.column].filter((id) => id !== action.id);
      const destination = from.column === action.toColumn ? source : state.columns[action.toColumn];
      const to = Math.max(0, Math.min(action.toIndex, destination.length));
      if (from.column === action.toColumn && from.index === to) return state;
      return {
        ...state,
        columns: {
          ...state.columns,
          [from.column]: source,
          [action.toColumn]: insertAt(destination, to, action.id),
        },
      };
    }
  }
}

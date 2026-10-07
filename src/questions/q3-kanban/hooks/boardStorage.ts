import { COLUMN_IDS } from '../columns';
import type { BoardState, Card } from '../types';
import { emptyBoard } from './boardReducer';

export const STORAGE_KEY = 'fe-interview-prep:q3-kanban:board';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCard(id: string, value: unknown): Card | null {
  if (!isRecord(value)) return null;
  const { title, description } = value;
  if (value.id !== id || typeof title !== 'string' || !title.trim()) return null;
  if (typeof description !== 'string') return null;
  return { id, title, description };
}

/**
 * Validates untrusted data (from storage) into a board, or returns null. Every card must appear
 * in exactly one column and every column id must point at a card, so a corrupt save can never
 * produce a board the reducer can't handle.
 */
export function parseBoard(value: unknown): BoardState | null {
  if (!isRecord(value) || !isRecord(value.cards) || !isRecord(value.columns)) return null;

  // Null prototype + `Object.hasOwn`: a saved id like "__proto__" or "toString" can neither
  // rewrite the object's prototype nor pass the lookup by matching an inherited member.
  const cards: Record<string, Card> = Object.create(null);
  for (const [id, raw] of Object.entries(value.cards)) {
    if (id in Object.prototype) return null;
    const card = parseCard(id, raw);
    if (!card) return null;
    cards[id] = card;
  }

  const columns = emptyBoard().columns;
  const seen = new Set<string>();
  for (const column of COLUMN_IDS) {
    const ids: unknown = value.columns[column];
    if (!Array.isArray(ids)) return null;
    for (const id of ids) {
      if (typeof id !== 'string' || !Object.hasOwn(cards, id) || seen.has(id)) return null;
      seen.add(id);
      columns[column].push(id);
    }
  }
  if (seen.size !== Object.keys(cards).length) return null;

  // Hand the reducer an ordinary object again (it spreads `cards` on every change).
  return { cards: { ...cards }, columns };
}

/** Reads the saved board; falls back to an empty board when missing, corrupt or unavailable. */
export function loadBoard(): BoardState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBoard();
    return parseBoard(JSON.parse(raw)) ?? emptyBoard();
  } catch {
    return emptyBoard();
  }
}

export function saveBoard(board: BoardState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    // Storage full or blocked (e.g. private mode): the board still works for this session.
  }
}

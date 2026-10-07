export type ColumnId = 'todo' | 'inProgress' | 'done';

export interface Column {
  id: ColumnId;
  title: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
}

/** What the card form produces: a card without an id yet. */
export interface CardDraft {
  title: string;
  description: string;
}

/**
 * Normalized board: cards are looked up by id, and each column owns an ordered list of ids. A
 * card lives in exactly one column, so a move edits two id lists and never copies card data.
 */
export interface BoardState {
  cards: Record<string, Card>;
  columns: Record<ColumnId, string[]>;
}

export interface CardLocation {
  column: ColumnId;
  index: number;
}

/** A deleted card plus where it was, so it can be put back by "Undo". */
export interface DeletedCard {
  card: Card;
  location: CardLocation;
}

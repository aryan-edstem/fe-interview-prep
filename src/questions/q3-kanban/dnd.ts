import type { CardLocation, ColumnId } from './types';

/**
 * Converts a drop slot (0..n, counted in the column as rendered, dragged card included) into the
 * reducer's `toIndex` (counted after the card is removed). Dropping below yourself in the same
 * column shifts the slot up by one.
 */
export function dropToMoveIndex(from: CardLocation, toColumn: ColumnId, slot: number): number {
  return from.column === toColumn && from.index < slot ? slot - 1 : slot;
}

/** True when dropping into `slot` would leave the card where it already is. */
export function isNoopDrop(from: CardLocation, toColumn: ColumnId, slot: number): boolean {
  return from.column === toColumn && (slot === from.index || slot === from.index + 1);
}

/** The slot a pointer at `clientY` points to: before the first card whose midpoint is below it. */
export function slotAt(cardElements: readonly HTMLElement[], clientY: number): number {
  const index = cardElements.findIndex((el) => {
    const rect = el.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2;
  });
  return index === -1 ? cardElements.length : index;
}

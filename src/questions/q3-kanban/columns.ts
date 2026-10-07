import type { Column, ColumnId } from './types';

/** Columns in board order (left to right). */
export const COLUMNS: readonly Column[] = [
  { id: 'todo', title: 'To do' },
  { id: 'inProgress', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

export const COLUMN_IDS: readonly ColumnId[] = COLUMNS.map((column) => column.id);

export function columnTitle(id: ColumnId): string {
  return COLUMNS.find((column) => column.id === id)?.title ?? id;
}

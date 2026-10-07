import type { BoardState, Card } from '../types';
import { boardReducer, emptyBoard, locateCard } from './boardReducer';

const card = (id: string, title = id.toUpperCase()): Card => ({ id, title, description: '' });

/** a, b, c in To do; d in In progress; Done empty. */
function seed(): BoardState {
  return {
    cards: { a: card('a'), b: card('b'), c: card('c'), d: card('d') },
    columns: { todo: ['a', 'b', 'c'], inProgress: ['d'], done: [] },
  };
}

describe('boardReducer', () => {
  describe('add', () => {
    it('appends a card to the end of the column by default', () => {
      const next = boardReducer(seed(), { type: 'add', card: card('e'), column: 'todo' });
      expect(next.columns.todo).toEqual(['a', 'b', 'c', 'e']);
      expect(next.cards.e).toEqual(card('e'));
    });

    it('inserts at a given index (used to undo a delete)', () => {
      const next = boardReducer(seed(), { type: 'add', card: card('e'), column: 'todo', index: 1 });
      expect(next.columns.todo).toEqual(['a', 'e', 'b', 'c']);
    });

    it('trims the title and ignores blank titles or duplicate ids', () => {
      const state = seed();
      const trimmed = boardReducer(state, {
        type: 'add',
        card: { id: 'e', title: '  Write tests  ', description: '' },
        column: 'done',
      });
      expect(trimmed.cards.e?.title).toBe('Write tests');
      expect(boardReducer(state, { type: 'add', card: card('e', '   '), column: 'done' })).toBe(
        state,
      );
      expect(boardReducer(state, { type: 'add', card: card('a'), column: 'done' })).toBe(state);
    });
  });

  describe('edit', () => {
    it('updates title and description without moving the card', () => {
      const next = boardReducer(seed(), {
        type: 'edit',
        id: 'b',
        draft: { title: 'Renamed', description: 'Details' },
      });
      expect(next.cards.b).toEqual({ id: 'b', title: 'Renamed', description: 'Details' });
      expect(next.columns.todo).toEqual(['a', 'b', 'c']);
    });

    it('rejects a blank title', () => {
      const state = seed();
      const next = boardReducer(state, {
        type: 'edit',
        id: 'b',
        draft: { title: ' ', description: '' },
      });
      expect(next).toBe(state);
    });
  });

  describe('delete', () => {
    it('removes the card and its id from its column', () => {
      const next = boardReducer(seed(), { type: 'delete', id: 'b' });
      expect(next.cards.b).toBeUndefined();
      expect(next.columns.todo).toEqual(['a', 'c']);
    });

    it('ignores unknown ids', () => {
      const state = seed();
      expect(boardReducer(state, { type: 'delete', id: 'zzz' })).toBe(state);
    });
  });

  describe('move', () => {
    it('moves a card to another column, updating both columns and their counts', () => {
      const next = boardReducer(seed(), { type: 'move', id: 'b', toColumn: 'done', toIndex: 0 });
      expect(next.columns.todo).toEqual(['a', 'c']);
      expect(next.columns.done).toEqual(['b']);
      expect(next.columns.inProgress).toEqual(['d']);
      expect(next.columns.todo).toHaveLength(2);
      expect(next.columns.done).toHaveLength(1);
      expect(Object.keys(next.cards)).toHaveLength(4);
    });

    it('inserts at the requested position in the destination column', () => {
      const next = boardReducer(seed(), {
        type: 'move',
        id: 'a',
        toColumn: 'inProgress',
        toIndex: 0,
      });
      expect(next.columns.inProgress).toEqual(['a', 'd']);
    });

    it('reorders within a column', () => {
      const down = boardReducer(seed(), { type: 'move', id: 'a', toColumn: 'todo', toIndex: 2 });
      expect(down.columns.todo).toEqual(['b', 'c', 'a']);
      const up = boardReducer(seed(), { type: 'move', id: 'c', toColumn: 'todo', toIndex: 0 });
      expect(up.columns.todo).toEqual(['c', 'a', 'b']);
    });

    it('clamps out-of-range indexes', () => {
      const end = boardReducer(seed(), {
        type: 'move',
        id: 'a',
        toColumn: 'inProgress',
        toIndex: 99,
      });
      expect(end.columns.inProgress).toEqual(['d', 'a']);
      const start = boardReducer(seed(), { type: 'move', id: 'c', toColumn: 'todo', toIndex: -5 });
      expect(start.columns.todo).toEqual(['c', 'a', 'b']);
    });

    it('returns the same state for a no-op or unknown card', () => {
      const state = seed();
      expect(boardReducer(state, { type: 'move', id: 'b', toColumn: 'todo', toIndex: 1 })).toBe(
        state,
      );
      expect(boardReducer(state, { type: 'move', id: 'zzz', toColumn: 'done', toIndex: 0 })).toBe(
        state,
      );
    });

    it('does not mutate the previous state', () => {
      const state = seed();
      boardReducer(state, { type: 'move', id: 'a', toColumn: 'done', toIndex: 0 });
      expect(state).toEqual(seed());
    });
  });
});

describe('locateCard', () => {
  it('finds the column and index of a card', () => {
    expect(locateCard(seed(), 'c')).toEqual({ column: 'todo', index: 2 });
    expect(locateCard(seed(), 'd')).toEqual({ column: 'inProgress', index: 0 });
    expect(locateCard(emptyBoard(), 'a')).toBeNull();
  });
});

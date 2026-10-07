import { dropToMoveIndex, isNoopDrop } from './dnd';

describe('dropToMoveIndex', () => {
  it('keeps the slot when dropping into another column', () => {
    expect(dropToMoveIndex({ column: 'todo', index: 0 }, 'done', 2)).toBe(2);
  });

  it('shifts the slot up when dropping below the card in its own column', () => {
    // [a, b, c]: dragging a (0) to slot 3 (after c) ends at index 2 once a is removed.
    expect(dropToMoveIndex({ column: 'todo', index: 0 }, 'todo', 3)).toBe(2);
  });

  it('keeps the slot when dropping above the card in its own column', () => {
    expect(dropToMoveIndex({ column: 'todo', index: 2 }, 'todo', 0)).toBe(0);
  });
});

describe('isNoopDrop', () => {
  it('treats the slots directly above and below the card as no-ops', () => {
    const from = { column: 'todo', index: 1 } as const;
    expect(isNoopDrop(from, 'todo', 1)).toBe(true);
    expect(isNoopDrop(from, 'todo', 2)).toBe(true);
    expect(isNoopDrop(from, 'todo', 0)).toBe(false);
    expect(isNoopDrop(from, 'todo', 3)).toBe(false);
    expect(isNoopDrop(from, 'done', 1)).toBe(false);
  });
});

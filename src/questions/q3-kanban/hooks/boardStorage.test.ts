import type { BoardState } from '../types';
import { emptyBoard } from './boardReducer';
import { loadBoard, parseBoard, saveBoard, STORAGE_KEY } from './boardStorage';

const valid: BoardState = {
  cards: {
    a: { id: 'a', title: 'Write spec', description: '' },
    b: { id: 'b', title: 'Ship it', description: 'Friday' },
  },
  columns: { todo: ['a'], inProgress: [], done: ['b'] },
};

afterEach(() => localStorage.clear());

function loadBoardFrom(raw: string) {
  localStorage.setItem(STORAGE_KEY, raw);
  return loadBoard();
}

describe('parseBoard', () => {
  it('accepts a well-formed board', () => {
    expect(parseBoard(structuredClone(valid))).toEqual(valid);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['missing columns', { cards: {} }],
    ['a column that is not an array', { ...valid, columns: { ...valid.columns, done: 'b' } }],
    ['a column id with no card', { ...valid, columns: { ...valid.columns, todo: ['a', 'zzz'] } }],
    [
      'a card in two columns',
      { ...valid, columns: { todo: ['a', 'b'], inProgress: [], done: ['b'] } },
    ],
    ['a card in no column', { ...valid, columns: { todo: ['a'], inProgress: [], done: [] } }],
    [
      'a card without a title',
      { ...valid, cards: { ...valid.cards, a: { id: 'a', description: '' } } },
    ],
    [
      'a card whose id does not match its key',
      { ...valid, cards: { ...valid.cards, a: { ...valid.cards.a, id: 'x' } } },
    ],
  ])('rejects %s', (_label, value) => {
    expect(parseBoard(value)).toBeNull();
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'rejects the prototype key %s as a card id',
    (key) => {
      // JSON.parse creates "__proto__" as an own property, exactly like a tampered save would.
      const saved = JSON.parse(
        JSON.stringify({ cards: {}, columns: { todo: [key], inProgress: [], done: [] } }).replace(
          '"cards":{}',
          `"cards":{"${key}":{"id":"${key}","title":"Evil","description":""}}`,
        ),
      );
      expect(parseBoard(saved)).toBeNull();
    },
  );

  it('rejects a column id that only matches an inherited member', () => {
    expect(
      parseBoard({ cards: {}, columns: { todo: ['toString'], inProgress: [], done: [] } }),
    ).toBeNull();
  });

  it('never pollutes Object.prototype', () => {
    loadBoardFrom('{"cards":{"__proto__":{"polluted":true}},"columns":{}}');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('loadBoard / saveBoard', () => {
  it('round-trips a board through localStorage', () => {
    saveBoard(valid);
    expect(loadBoard()).toEqual(valid);
  });

  it('falls back to an empty board when nothing is saved', () => {
    expect(loadBoard()).toEqual(emptyBoard());
  });

  it('falls back to an empty board on corrupt JSON or invalid data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadBoard()).toEqual(emptyBoard());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards: 1, columns: 2 }));
    expect(loadBoard()).toEqual(emptyBoard());
  });
});

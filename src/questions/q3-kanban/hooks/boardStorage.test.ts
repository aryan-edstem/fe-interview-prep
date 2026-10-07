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

import type { ComponentType, LazyExoticComponent } from 'react';

export interface QuestionMeta {
  /** Sort position in the nav (1-5). */
  order: number;
  /** URL segment, e.g. `cart` -> `/cart`. */
  slug: string;
  title: string;
  summary: string;
  /** Short concept labels shown on the home card, e.g. `['useReducer', 'localStorage']`. */
  tags?: string[];
}

export interface Question extends QuestionMeta {
  Page: LazyExoticComponent<ComponentType>;
}

import { lazy, type ComponentType } from 'react';
import type { Question, QuestionMeta } from '@/questions/types';

type PageModule = { default: ComponentType };

// Each question is a self-contained folder `src/questions/<id>/` exposing `meta.ts` and a default
// export from `Page.tsx`. Discovery by glob means adding a question never edits a shared file.
const metas = import.meta.glob<{ meta: QuestionMeta }>('./*/meta.ts', { eager: true });
const pages = import.meta.glob<PageModule>('./*/Page.tsx');

export function buildRegistry(
  metaModules: Record<string, { meta: QuestionMeta }>,
  pageLoaders: Record<string, () => Promise<PageModule>>,
): Question[] {
  return Object.entries(metaModules)
    .map(([path, { meta }]) => {
      const pagePath = path.replace(/meta\.ts$/, 'Page.tsx');
      const loader = pageLoaders[pagePath];
      if (!loader) throw new Error(`Question at ${path} is missing Page.tsx`);
      return { ...meta, Page: lazy(loader) };
    })
    .sort((a, b) => a.order - b.order);
}

export const questions = buildRegistry(metas, pages);

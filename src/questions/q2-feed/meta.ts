import type { QuestionMeta } from '@/questions/types';

export const meta: QuestionMeta = {
  order: 2,
  slug: 'feed',
  title: 'Infinite feed',
  summary:
    'Posts that load as you scroll, without duplicate requests, and keep your place on back.',
  tags: ['IntersectionObserver', 'useSyncExternalStore', 'Scroll restoration'],
};

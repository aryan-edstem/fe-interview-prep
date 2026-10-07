import type { QuestionMeta } from '@/questions/types';

export const meta: QuestionMeta = {
  order: 5,
  slug: 'comments',
  title: 'Offline comments',
  summary:
    'A comment thread that posts optimistically, queues comments while offline and retries without duplicates.',
  tags: ['Optimistic UI', 'Offline queue', 'Idempotency'],
};

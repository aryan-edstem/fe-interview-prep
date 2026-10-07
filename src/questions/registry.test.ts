import { buildRegistry } from '@/questions/registry';

const page = () => Promise.resolve({ default: () => null });
const meta = (order: number, slug: string) => ({ meta: { order, slug, title: slug, summary: '' } });

describe('buildRegistry', () => {
  it('sorts questions by order and pairs each meta with its page', () => {
    const result = buildRegistry(
      { './q2-b/meta.ts': meta(2, 'b'), './q1-a/meta.ts': meta(1, 'a') },
      { './q1-a/Page.tsx': page, './q2-b/Page.tsx': page },
    );
    expect(result.map((q) => q.slug)).toEqual(['a', 'b']);
  });

  it('fails loudly when a question folder has no Page.tsx', () => {
    expect(() => buildRegistry({ './q1-a/meta.ts': meta(1, 'a') }, {})).toThrow(/missing Page.tsx/);
  });
});

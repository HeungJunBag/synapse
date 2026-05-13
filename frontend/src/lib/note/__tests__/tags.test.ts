import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../supabase/client';
import { upsertTags, getTagsForNote } from '../tags';

// Proxy-based mock: any chain of calls resolves to result
function makeProxy(result: unknown) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
      }
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

beforeEach(() => vi.clearAllMocks());

describe('upsertTags', () => {
  it('태그가 없으면 아무것도 하지 않는다', async () => {
    await upsertTags('note-uuid-1', []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('태그를 upsert하고 note_tags에 연결한다', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeProxy({ data: [{ id: 'tag-uuid-1' }], error: null }) as never) // tags upsert
      .mockReturnValueOnce(makeProxy({ error: null }) as never); // note_tags insert

    await upsertTags('note-uuid-1', ['물리학']);

    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'tags');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'note_tags');
  });
});

describe('getTagsForNote', () => {
  it('note_id로 태그 목록을 반환한다', async () => {
    const mockTag = { id: 'tag-uuid-1', user_id: 'user-1', name: '물리학', created_at: '' };
    vi.mocked(supabase.from).mockReturnValue(
      makeProxy({ data: [{ tags: mockTag }], error: null }) as never
    );

    const result = await getTagsForNote('note-uuid-1');

    expect(supabase.from).toHaveBeenCalledWith('note_tags');
    expect(result).toEqual([mockTag]);
  });
});

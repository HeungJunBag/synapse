import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('../parse-links', () => ({
  parseLinkTitles: vi.fn(),
}));

import { supabase } from '../../supabase/client';
import { parseLinkTitles } from '../parse-links';
import { syncNoteLinks, getOutgoingLinks, getBacklinks } from '../links';

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

describe('getOutgoingLinks', () => {
  it('source_note_id로 아웃고잉 링크를 반환한다', async () => {
    const mockLinks = [{ id: 'link-1', source_note_id: 'src', target_note_id: 'tgt', created_at: '' }];
    vi.mocked(supabase.from).mockReturnValue(makeProxy({ data: mockLinks, error: null }) as never);

    const result = await getOutgoingLinks('src');
    expect(supabase.from).toHaveBeenCalledWith('note_links');
    expect(result).toEqual(mockLinks);
  });
});

describe('getBacklinks', () => {
  it('target_note_id로 백링크를 반환한다', async () => {
    const mockLinks = [{ id: 'link-2', source_note_id: 'src', target_note_id: 'tgt', created_at: '' }];
    vi.mocked(supabase.from).mockReturnValue(makeProxy({ data: mockLinks, error: null }) as never);

    const result = await getBacklinks('tgt');
    expect(supabase.from).toHaveBeenCalledWith('note_links');
    expect(result).toEqual(mockLinks);
  });
});

describe('syncNoteLinks', () => {
  it('링크가 없으면 삭제만 수행한다', async () => {
    vi.mocked(parseLinkTitles).mockReturnValue([]);
    vi.mocked(supabase.from).mockReturnValue(makeProxy({ error: null }) as never);

    await syncNoteLinks('src', '링크 없는 본문');

    expect(parseLinkTitles).toHaveBeenCalledWith('링크 없는 본문');
    // note_links delete only — no notes lookup
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('note_links');
  });

  it('링크가 있으면 notes 조회 후 삭제 및 삽입한다', async () => {
    vi.mocked(parseLinkTitles).mockReturnValue(['파동함수']);
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeProxy({ data: [{ id: 'target-uuid' }], error: null }) as never) // notes lookup
      .mockReturnValueOnce(makeProxy({ error: null }) as never)  // note_links delete
      .mockReturnValueOnce(makeProxy({ error: null }) as never); // note_links insert

    await syncNoteLinks('src', '[[파동함수]]');

    expect(parseLinkTitles).toHaveBeenCalledWith('[[파동함수]]');
    expect(supabase.from).toHaveBeenCalledTimes(3);
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'notes');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'note_links');
    expect(supabase.from).toHaveBeenNthCalledWith(3, 'note_links');
  });
});

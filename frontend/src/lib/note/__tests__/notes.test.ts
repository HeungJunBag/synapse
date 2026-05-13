import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotes, getNoteById, createNote, updateNote, deleteNote } from '../notes';

// Supabase 클라이언트 모킹
vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client';

const mockNote = {
  id: 'note-uuid-1',
  user_id: 'user-uuid-1',
  title: '양자역학 기초',
  content: '[[파동함수]]란 무엇인가',
  created_at: '2026-05-13T00:00:00Z',
  updated_at: '2026-05-13T00:00:00Z',
};

function makeChain(returnValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order:  vi.fn().mockResolvedValue(returnValue),
  };
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe('getNotes', () => {
  it('노트 목록을 최신순으로 반환한다', async () => {
    const chain = makeChain({ data: [mockNote], error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getNotes();
    expect(supabase.from).toHaveBeenCalledWith('notes');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(result).toEqual([mockNote]);
  });
});

describe('getNoteById', () => {
  it('id로 단일 노트를 반환한다', async () => {
    const chain = makeChain({ data: mockNote, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getNoteById('note-uuid-1');
    expect(chain.eq).toHaveBeenCalledWith('id', 'note-uuid-1');
    expect(result).toEqual(mockNote);
  });
});

describe('createNote', () => {
  it('새 노트를 생성하고 반환한다', async () => {
    const chain = makeChain({ data: mockNote, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await createNote({ title: '양자역학 기초', content: '[[파동함수]]란 무엇인가' });
    expect(chain.insert).toHaveBeenCalledWith({ title: '양자역학 기초', content: '[[파동함수]]란 무엇인가' });
    expect(result).toEqual(mockNote);
  });
});

describe('updateNote', () => {
  it('노트를 수정하고 반환한다', async () => {
    const updated = { ...mockNote, title: '수정된 제목' };
    const chain = makeChain({ data: updated, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await updateNote('note-uuid-1', { title: '수정된 제목' });
    expect(chain.update).toHaveBeenCalledWith({ title: '수정된 제목' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'note-uuid-1');
    expect(result).toEqual(updated);
  });
});

describe('deleteNote', () => {
  it('노트를 삭제한다', async () => {
    const chain = makeChain({ error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    await deleteNote('note-uuid-1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'note-uuid-1');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

vi.mock('@/lib/note/parse-links', () => ({
  parseLinkTitles: vi.fn().mockReturnValue([]),
}))

import { getLinksAction, getGraphDataAction } from '../actions/note-actions'

beforeEach(() => vi.clearAllMocks())

describe('getLinksAction', () => {
  it('아웃고잉 링크와 백링크를 반환한다', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'note_links') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((col: string) => {
              if (col === 'source_note_id') {
                return Promise.resolve({ data: [{ target_note_id: 'note-2' }], error: null })
              }
              return Promise.resolve({ data: [], error: null })
            }),
          }
        }
        // notes table
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ id: 'note-2', title: '연결된 노트' }],
            error: null,
          }),
        }
      }),
    }
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getLinksAction('note-1')
    expect(result.outgoing).toEqual([{ id: 'note-2', title: '연결된 노트' }])
    expect(result.backlinks).toEqual([])
  })

  it('링크가 없으면 빈 배열을 반환한다', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    }
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getLinksAction('note-1')
    expect(result.outgoing).toEqual([])
    expect(result.backlinks).toEqual([])
  })
})

describe('getGraphDataAction', () => {
  it('nodes와 links 형태로 그래프 데이터를 반환한다', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'notes') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'note-1', title: '노트 1' }],
              error: null,
            }),
          }
        }
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ source_note_id: 'note-1', target_note_id: 'note-2' }],
            error: null,
          }),
        }
      }),
    }
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getGraphDataAction()
    expect(result.nodes).toEqual([{ id: 'note-1', title: '노트 1' }])
    expect(result.links).toEqual([{ source: 'note-1', target: 'note-2' }])
  })
})

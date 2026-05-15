'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/(auth)/login/actions'
import type { NoteWithTags, Tag } from '@/types/note'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { GraphView } from './GraphView'

type Tab = 'notes' | 'graph'

interface NoteLayoutProps {
  notes: NoteWithTags[]
  noteId: string | null
  userEmail: string
}

export function NoteLayout({ notes, noteId, userEmail }: NoteLayoutProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('notes')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const allTags = useMemo(
    () =>
      Array.from(
        new Map(notes.flatMap((n) => n.tags).map((t) => [t.name, t])).values()
      ),
    [notes]
  )

  const filteredNotes = useMemo(() => {
    let result = notes
    if (selectedTags.length > 0) {
      result = result.filter((note) =>
        selectedTags.every((tag) => note.tags.some((t) => t.name === tag))
      )
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(q)
      )
    }
    return result
  }, [notes, selectedTags, searchQuery])

  const toggleTag = useCallback((name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }, [])

  const clearTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  const selectNote = useCallback(
    (id: string) => {
      setDrawerOpen(false)
      router.push(`/?noteId=${id}`)
    },
    [router]
  )

  const newNote = useCallback(() => {
    setDrawerOpen(false)
    router.push('/?noteId=new')
  }, [router])

  const noteListProps = {
    notes: filteredNotes,
    selectedNoteId: noteId,
    onSelect: selectNote,
    onNew: newNote,
    searchQuery,
    onSearchChange: setSearchQuery,
    allTags,
    selectedTags,
    onTagToggle: toggleTag,
    onClearTags: clearTags,
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ─── 헤더 ─── */}
      <header className="flex-shrink-0 bg-slate-800 text-white">
        {/* 1행: 햄버거(모바일) | 시냅스 | 이메일+로그아웃 */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* 햄버거 버튼 — 모바일만 */}
          <button
            className="md:hidden text-slate-300 hover:text-white text-xl leading-none"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
          >
            ☰
          </button>

          {/* 로고 */}
          <span className="font-bold text-sm">시냅스</span>

          {/* 데스크탑 탭 — md 이상에서만 표시 */}
          <nav className="hidden md:flex gap-4">
            <button
              onClick={() => setTab('notes')}
              className={`text-sm pb-0.5 ${
                tab === 'notes'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📝 노트
            </button>
            <button
              onClick={() => setTab('graph')}
              className={`text-sm pb-0.5 ${
                tab === 'graph'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🕸 그래프
            </button>
          </nav>

          {/* 이메일 + 로그아웃 */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:block">{userEmail}</span>
            <form action={signOut}>
              <button type="submit" className="underline hover:text-white">
                로그아웃
              </button>
            </form>
          </div>
        </div>

        {/* 2행: 모바일 탭바 — md 미만에서만 표시 */}
        <div className="md:hidden flex border-t border-slate-700">
          <button
            onClick={() => setTab('notes')}
            className={`flex-1 py-2 text-sm ${
              tab === 'notes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400'
            }`}
          >
            📝 노트
          </button>
          <button
            onClick={() => setTab('graph')}
            className={`flex-1 py-2 text-sm ${
              tab === 'graph'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400'
            }`}
          >
            🕸 그래프
          </button>
        </div>
      </header>

      {/* ─── 탭 콘텐츠 ─── */}
      {tab === 'notes' ? (
        <div className="flex flex-1 overflow-hidden relative">
          {/* 백드롭 — 모바일, drawerOpen일 때만 */}
          {drawerOpen && (
            <button
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-label="메뉴 닫기"
            />
          )}

          {/* 모바일 슬라이드 드로어 */}
          <div
            className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 md:hidden ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <NoteList {...noteListProps} />
          </div>

          {/* 데스크탑 사이드바 */}
          <div className="hidden md:flex">
            <NoteList {...noteListProps} />
          </div>

          <NoteEditor
            noteId={noteId}
            allNotes={notes}
            onSaved={(id) => router.push(`/?noteId=${id}`)}
            onDeleted={() => router.push('/')}
          />
        </div>
      ) : (
        <GraphView onNodeClick={(id) => { setTab('notes'); selectNote(id) }} />
      )}
    </div>
  )
}

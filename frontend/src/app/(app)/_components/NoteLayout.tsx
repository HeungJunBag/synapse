'use client'

import { useState, useMemo } from 'react'
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

  function toggleTag(name: string) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  function clearTags() {
    setSelectedTags([])
  }

  function selectNote(id: string) {
    router.push(`/?noteId=${id}`)
  }

  function newNote() {
    router.push('/?noteId=new')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 네비게이션 */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white flex-shrink-0">
        <span className="font-bold text-sm">시냅스</span>
        <nav className="flex gap-4">
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
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{userEmail}</span>
          <form action={signOut}>
            <button type="submit" className="underline hover:text-white">
              로그아웃
            </button>
          </form>
        </div>
      </header>

      {/* 탭 콘텐츠 */}
      {tab === 'notes' ? (
        <div className="flex flex-1 overflow-hidden">
          <NoteList
            notes={filteredNotes}
            selectedNoteId={noteId}
            onSelect={selectNote}
            onNew={newNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={toggleTag}
            onClearTags={clearTags}
          />
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

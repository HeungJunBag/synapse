'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/(auth)/login/actions'
import type { Note } from '@/types/note'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { GraphView } from './GraphView'

type Tab = 'notes' | 'graph'

interface NoteLayoutProps {
  notes: Note[]
  noteId: string | null
  userEmail: string
}

export function NoteLayout({ notes, noteId, userEmail }: NoteLayoutProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('notes')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(note =>
      note.title.toLowerCase().includes(q) ||
      note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

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

'use client'

import type { Note } from '@/types/note'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function NoteList({ notes, selectedNoteId, onSelect, onNew }: NoteListProps) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">
      <div className="p-3 border-b border-slate-200">
        <button
          onClick={onNew}
          className="w-full bg-slate-800 text-white rounded-md py-1.5 text-sm font-medium hover:bg-slate-700"
        >
          + 새 노트
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-4">
            아직 노트가 없습니다
          </p>
        )}
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
              selectedNoteId === note.id
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-white border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-medium truncate">
              {note.title || '제목 없음'}
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              {note.content.replace(/<[^>]+>/g, '').slice(0, 40) || '내용 없음'}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}

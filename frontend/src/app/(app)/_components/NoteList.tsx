'use client'

import type { NoteWithTags } from '@/types/note'

interface NoteListProps {
  notes: NoteWithTags[]
  selectedNoteId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  allTags: string[]
  selectedTags: string[]
  onTagToggle: (name: string) => void
  onClearTags: () => void
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  onNew,
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onTagToggle,
  onClearTags,
}: NoteListProps) {
  return (
    <aside className="w-full h-full flex flex-col border-r border-slate-200 bg-slate-50">
      <div className="p-3 border-b border-slate-200 space-y-2">
        <button
          onClick={onNew}
          className="w-full bg-slate-800 text-white rounded-md py-1.5 text-sm font-medium hover:bg-slate-700"
        >
          + 새 노트
        </button>
        <div className="relative">
          <label htmlFor="note-search" className="sr-only">
            노트 검색
          </label>
          <input
            id="note-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="노트 검색..."
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm pr-7 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-xs"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                aria-pressed={selectedTags.includes(tag)}
                aria-label={`태그 ${tag} 필터`}
                className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-600 text-white'
                    : 'border border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-50'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={onClearTags}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                초기화
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.length === 0 && (
          <p className="text-xs text-slate-500 text-center mt-4">
            {searchQuery || selectedTags.length > 0
              ? '검색 결과 없음'
              : '아직 노트가 없습니다'}
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
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {note.content.replace(/<[^>]+>/g, '').slice(0, 40) || '내용 없음'}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}

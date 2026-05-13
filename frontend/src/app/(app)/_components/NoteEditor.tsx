'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { createWikiLinkExtension } from './WikiLinkExtension'
import type { Note } from '@/types/note'
import {
  getNoteAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from '../actions/note-actions'
import { NoteLinks } from './NoteLinks'

interface NoteEditorProps {
  noteId: string | null
  allNotes: Note[]
  onSaved: (id: string) => void
  onDeleted: () => void
}

export function NoteEditor({ noteId, allNotes, onSaved, onDeleted }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isNew = noteId === 'new'

  const allNotesRef = useRef(allNotes)
  useEffect(() => {
    allNotesRef.current = allNotes
  }, [allNotes])

  const editor = useEditor({
    extensions: [StarterKit, createWikiLinkExtension(allNotesRef)],
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[200px] prose prose-sm max-w-none',
      },
    },
  })

  useEffect(() => {
    if (!noteId || isNew) {
      setTitle('')
      setError(null)
      editor?.commands.setContent('')
      return
    }
    setError(null)
    getNoteAction(noteId)
      .then((note) => {
        setTitle(note.title)
        editor?.commands.setContent(note.content)
      })
      .catch(() => setError('노트를 불러오지 못했습니다.'))
  }, [noteId, isNew, editor])

  async function handleSave() {
    const content = editor?.getHTML() ?? ''
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const created = await createNoteAction(title || '제목 없음', content)
        onSaved(created.id)
      } else if (noteId) {
        await updateNoteAction(noteId, title, content)
      }
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!noteId || isNew) return
    if (!confirm('이 노트를 삭제할까요?')) return
    try {
      await deleteNoteAction(noteId)
      onDeleted()
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  if (!noteId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        노트를 선택하거나 새 노트를 만드세요
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 제목 + 버튼 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 flex-shrink-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="flex-1 text-lg font-bold outline-none placeholder:text-slate-300"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-1 text-sm hover:bg-red-100"
          >
            삭제
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs px-4 py-1 bg-red-50">{error}</p>
      )}

      {/* TipTap 에디터 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      {/* 링크 패널 (Task 6에서 구현) */}
      {!isNew && noteId && <NoteLinks noteId={noteId} />}
    </div>
  )
}

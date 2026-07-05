'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLinksAction } from '../actions/note-actions'

interface LinkItem {
  id: string
  title: string
}

interface NoteLinksProps {
  noteId: string
  tags: string[]
}

export function NoteLinks({ noteId, tags }: NoteLinksProps) {
  const router = useRouter()
  const [outgoing, setOutgoing] = useState<LinkItem[]>([])
  const [backlinks, setBacklinks] = useState<LinkItem[]>([])

  useEffect(() => {
    if (!noteId) return
    getLinksAction(noteId).then((links) => {
      setOutgoing(links.outgoing)
      setBacklinks(links.backlinks)
    })
  }, [noteId])

  const hasContent = outgoing.length > 0 || backlinks.length > 0 || tags.length > 0
  if (!hasContent) return null

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex-shrink-0">
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs"
          >
            #{tag}
          </span>
        ))}
        {outgoing.map((note) => (
          <button
            key={note.id}
            onClick={() => router.push(`/?noteId=${note.id}`)}
            className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 text-xs hover:bg-blue-100 transition-colors"
          >
            → {note.title}
          </button>
        ))}
        {backlinks.map((note) => (
          <button
            key={note.id}
            onClick={() => router.push(`/?noteId=${note.id}`)}
            className="bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-0.5 text-xs hover:bg-green-100 transition-colors"
          >
            ← {note.title}
          </button>
        ))}
      </div>
    </div>
  )
}

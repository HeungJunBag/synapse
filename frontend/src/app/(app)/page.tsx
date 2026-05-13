import { createClient } from '@/lib/supabase/server'
import { NoteLayout } from './_components/NoteLayout'
import type { Note } from '@/types/note'

interface Props {
  searchParams: Promise<{ noteId?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { noteId } = await searchParams

  const supabase = await createClient()
  const [notesResult, authResult] = await Promise.all([
    supabase.from('notes').select('*').order('updated_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  if (notesResult.error) throw notesResult.error

  const notes: Note[] = notesResult.data ?? []
  const userEmail = authResult.data.user?.email ?? ''

  return (
    <NoteLayout
      notes={notes}
      noteId={noteId ?? null}
      userEmail={userEmail}
    />
  )
}

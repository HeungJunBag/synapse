import { createClient } from '@/lib/supabase/server'
import { NoteLayout } from './_components/NoteLayout'
import { getNotesWithTagsAction } from './actions/note-actions'

interface Props {
  searchParams: Promise<{ noteId?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { noteId } = await searchParams

  const supabase = await createClient()
  const [notes, authResult] = await Promise.all([
    getNotesWithTagsAction(),
    supabase.auth.getUser(),
  ])

  const userEmail = authResult.data.user?.email ?? ''

  return (
    <NoteLayout
      notes={notes}
      noteId={noteId ?? null}
      userEmail={userEmail}
    />
  )
}

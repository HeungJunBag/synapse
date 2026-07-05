import { cookies } from 'next/headers'
import { NoteLayout } from './_components/NoteLayout'
import { getNotesWithTagsAction } from './actions/note-actions'

interface Props {
  searchParams: Promise<{ noteId?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { noteId } = await searchParams

  const cookieStore = await cookies()
  const userEmail = cookieStore.get('user_email')?.value ?? ''

  const notes = await getNotesWithTagsAction()

  return (
    <NoteLayout
      notes={notes}
      noteId={noteId ?? null}
      userEmail={userEmail}
    />
  )
}

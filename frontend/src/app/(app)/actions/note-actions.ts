'use server'

import { createClient } from '@/lib/supabase/server'
import { parseLinkTitles } from '@/lib/note/parse-links'
import { revalidatePath } from 'next/cache'
import type { Note, Tag } from '@/types/note'

export async function getNotesAction(): Promise<Note[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getNoteAction(id: string): Promise<Note> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createNoteAction(title: string, content: string): Promise<Note> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .insert({ title, content })
    .select()
    .single()
  if (error) throw error
  await _syncLinks(supabase, data.id, content)
  revalidatePath('/', 'layout')
  return data
}

export async function updateNoteAction(id: string, title: string, content: string): Promise<Note> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await _syncLinks(supabase, id, content)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteNoteAction(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/', 'layout')
}

export async function getLinksAction(noteId: string): Promise<{
  outgoing: Array<{ id: string; title: string }>
  backlinks: Array<{ id: string; title: string }>
}> {
  const supabase = await createClient()

  const [outgoingResult, backlinksResult] = await Promise.all([
    supabase.from('note_links').select('target_note_id').eq('source_note_id', noteId),
    supabase.from('note_links').select('source_note_id').eq('target_note_id', noteId),
  ])

  const outgoingIds = (outgoingResult.data ?? [])
    .map((l: { target_note_id: string }) => l.target_note_id)
    .filter(Boolean)
  const backlinkIds = (backlinksResult.data ?? [])
    .map((l: { source_note_id: string }) => l.source_note_id)
    .filter(Boolean)

  const [outgoingNotes, backlinkNotes] = await Promise.all([
    outgoingIds.length > 0
      ? supabase.from('notes').select('id, title').in('id', outgoingIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    backlinkIds.length > 0
      ? supabase.from('notes').select('id, title').in('id', backlinkIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ])

  return {
    outgoing: outgoingNotes.data ?? [],
    backlinks: backlinkNotes.data ?? [],
  }
}

export async function getTagsAction(noteId: string): Promise<Tag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('note_tags')
    .select('tags(*)')
    .eq('note_id', noteId)
  if (error) throw error
  return (data ?? []).map((row: unknown) => (row as { tags: Tag }).tags)
}

export async function getGraphDataAction(): Promise<{
  nodes: Array<{ id: string; title: string }>
  links: Array<{ source: string; target: string }>
}> {
  const supabase = await createClient()
  const [notesResult, linksResult] = await Promise.all([
    supabase.from('notes').select('id, title'),
    supabase.from('note_links').select('source_note_id, target_note_id'),
  ])
  return {
    nodes: (notesResult.data ?? []).map((n: { id: string; title: string }) => ({
      id: n.id,
      title: n.title,
    })),
    links: (linksResult.data ?? []).map(
      (l: { source_note_id: string; target_note_id: string }) => ({
        source: l.source_note_id,
        target: l.target_note_id,
      })
    ),
  }
}

// 내부 함수: [[링크]] 동기화 (삭제 후 재삽입)
async function _syncLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  noteId: string,
  content: string
): Promise<void> {
  const titles = parseLinkTitles(content)
  let targetIds: string[] = []
  if (titles.length > 0) {
    const { data } = await supabase.from('notes').select('id').in('title', titles)
    targetIds = (data ?? []).map((n: { id: string }) => n.id)
  }
  await supabase.from('note_links').delete().eq('source_note_id', noteId)
  if (targetIds.length > 0) {
    await supabase.from('note_links').insert(
      targetIds.map((targetId) => ({
        source_note_id: noteId,
        target_note_id: targetId,
      }))
    )
  }
}

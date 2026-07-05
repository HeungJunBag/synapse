'use server'

import { apiClient } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'
import type { NoteWithTags, LinkData, GraphData } from '@/types/note'

// Spring Boot NoteResponse는 camelCase로 반환됨
interface SpringNoteResponse {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

function toNoteWithTags(n: SpringNoteResponse): NoteWithTags {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    tags: n.tags,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  }
}

export async function getNotesWithTagsAction(): Promise<NoteWithTags[]> {
  const data = await apiClient<SpringNoteResponse[]>('/api/notes')
  return data.map(toNoteWithTags)
}

export async function getNoteAction(id: string): Promise<NoteWithTags> {
  const data = await apiClient<SpringNoteResponse>(`/api/notes/${id}`)
  return toNoteWithTags(data)
}

export async function createNoteAction(title: string, content: string): Promise<NoteWithTags> {
  const data = await apiClient<SpringNoteResponse>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  })
  revalidatePath('/', 'layout')
  return toNoteWithTags(data)
}

export async function updateNoteAction(id: string, title: string, content: string): Promise<NoteWithTags> {
  const data = await apiClient<SpringNoteResponse>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content }),
  })
  revalidatePath('/', 'layout')
  return toNoteWithTags(data)
}

export async function deleteNoteAction(id: string): Promise<void> {
  await apiClient<null>(`/api/notes/${id}`, { method: 'DELETE' })
  revalidatePath('/', 'layout')
}

export async function getLinksAction(noteId: string): Promise<LinkData> {
  return apiClient<LinkData>(`/api/notes/${noteId}/links`)
}

export async function getGraphDataAction(): Promise<GraphData> {
  return apiClient<GraphData>('/api/graph')
}

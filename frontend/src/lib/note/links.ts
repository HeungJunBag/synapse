import { supabase } from '../supabase/client';
import { parseLinkTitles } from './parse-links';
import type { NoteLink } from '../../types/note';

export async function syncNoteLinks(sourceNoteId: string, content: string): Promise<void> {
  const titles = parseLinkTitles(content);

  let targetIds: string[] = [];
  if (titles.length > 0) {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title')
      .in('title', titles);
    if (error) throw error;
    targetIds = (data ?? []).map((n: { id: string }) => n.id);
  }

  const { error: deleteError } = await supabase
    .from('note_links')
    .delete()
    .eq('source_note_id', sourceNoteId);
  if (deleteError) throw deleteError;

  if (targetIds.length > 0) {
    const rows = targetIds.map((targetId) => ({
      source_note_id: sourceNoteId,
      target_note_id: targetId,
    }));
    const { error: insertError } = await supabase.from('note_links').insert(rows);
    if (insertError) throw insertError;
  }
}

export async function getOutgoingLinks(sourceNoteId: string): Promise<NoteLink[]> {
  const { data, error } = await supabase
    .from('note_links')
    .select('*')
    .eq('source_note_id', sourceNoteId);
  if (error) throw error;
  return data ?? [];
}

export async function getBacklinks(targetNoteId: string): Promise<NoteLink[]> {
  const { data, error } = await supabase
    .from('note_links')
    .select('*')
    .eq('target_note_id', targetNoteId);
  if (error) throw error;
  return data ?? [];
}

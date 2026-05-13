import { supabase } from '../supabase/client';
import type { Tag } from '../../types/note';

/**
 * 태그 이름 배열을 tags 테이블에 upsert하고 note_tags에 연결한다.
 * 에이전트 자동 태그 생성 시에도 동일하게 사용한다.
 */
export async function upsertTags(noteId: string, tagNames: string[]): Promise<void> {
  if (tagNames.length === 0) return;

  const { data, error: upsertError } = await supabase
    .from('tags')
    .upsert(tagNames.map((name) => ({ name })), { onConflict: 'user_id,name' })
    .select('id');
  if (upsertError) throw upsertError;

  const tagIds = (data ?? []).map((t: { id: string }) => t.id);

  const { error: linkError } = await supabase
    .from('note_tags')
    .insert(tagIds.map((tagId) => ({ note_id: noteId, tag_id: tagId })));
  if (linkError) throw linkError;
}

export async function getTagsForNote(noteId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('note_tags')
    .select('tags(*)')
    .eq('note_id', noteId);
  if (error) throw error;
  return (data ?? []).map((row: { tags: Tag }) => row.tags);
}

# 노트 도메인 스키마 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase 마이그레이션, TypeScript 타입, 데이터 접근 함수(CRUD + 링크 동기화 + 태그)를 TDD로 구현한다.

**Architecture:** Supabase(PostgreSQL)에 4개 테이블(notes, note_links, tags, note_tags)을 마이그레이션으로 생성하고, Next.js 프론트엔드에서 사용할 데이터 접근 함수를 `frontend/src/lib/note/` 아래에 모듈별로 분리한다. `[[링크]]` 파싱은 클라이언트에서 수행하며 저장 시 delete-then-insert로 note_links를 동기화한다.

**Tech Stack:** Next.js (App Router), Supabase JS Client v2, TypeScript, Vitest

---

## 파일 구조

```
supabase/
  migrations/
    20260513000000_create_note_tables.sql   # 테이블 DDL + 인덱스 + RLS

frontend/
  src/
    types/
      note.ts                               # TypeScript 타입 정의
    lib/
      supabase/
        client.ts                           # Supabase 클라이언트 싱글턴
      note/
        parse-links.ts                      # [[링크]] 파싱 유틸리티
        notes.ts                            # 노트 CRUD
        links.ts                            # 링크 동기화
        tags.ts                             # 태그 upsert / 조회
        __tests__/
          parse-links.test.ts
          notes.test.ts
          links.test.ts
          tags.test.ts
```

---

## Task 1: Supabase 마이그레이션 파일 작성

**Files:**
- Create: `supabase/migrations/20260513000000_create_note_tables.sql`

- [ ] **Step 1: supabase 디렉토리 생성**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: 마이그레이션 파일 작성**

`supabase/migrations/20260513000000_create_note_tables.sql` 에 다음 내용을 작성한다.

```sql
-- notes: 원자적 메모
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- note_links: 단방향 [[링크]] 관계
create table note_links (
  id             uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references notes(id) on delete cascade,
  target_note_id uuid not null references notes(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (source_note_id, target_note_id)
);

create index note_links_source_idx on note_links(source_note_id);
create index note_links_target_idx on note_links(target_note_id);

-- tags: 태그 마스터
create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- note_tags: 메모-태그 다대다 조인
create table note_tags (
  note_id    uuid not null references notes(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create index note_tags_tag_idx on note_tags(tag_id);

-- RLS 활성화
alter table notes     enable row level security;
alter table note_links enable row level security;
alter table tags      enable row level security;
alter table note_tags  enable row level security;

-- notes RLS 정책
create policy "notes: 본인만 조회"  on notes for select using (auth.uid() = user_id);
create policy "notes: 본인만 삽입"  on notes for insert with check (auth.uid() = user_id);
create policy "notes: 본인만 수정"  on notes for update using (auth.uid() = user_id);
create policy "notes: 본인만 삭제"  on notes for delete using (auth.uid() = user_id);

-- note_links RLS 정책 (source 노트 소유자 기준)
create policy "note_links: 본인 노트 링크만 조회"
  on note_links for select
  using (exists (select 1 from notes where notes.id = note_links.source_note_id and notes.user_id = auth.uid()));

create policy "note_links: 본인 노트 링크만 삽입"
  on note_links for insert
  with check (exists (select 1 from notes where notes.id = note_links.source_note_id and notes.user_id = auth.uid()));

create policy "note_links: 본인 노트 링크만 삭제"
  on note_links for delete
  using (exists (select 1 from notes where notes.id = note_links.source_note_id and notes.user_id = auth.uid()));

-- tags RLS 정책
create policy "tags: 본인만 조회" on tags for select using (auth.uid() = user_id);
create policy "tags: 본인만 삽입" on tags for insert with check (auth.uid() = user_id);
create policy "tags: 본인만 삭제" on tags for delete using (auth.uid() = user_id);

-- note_tags RLS 정책 (노트 소유자 기준)
create policy "note_tags: 본인 노트만 조회"
  on note_tags for select
  using (exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));

create policy "note_tags: 본인 노트만 삽입"
  on note_tags for insert
  with check (exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));

create policy "note_tags: 본인 노트만 삭제"
  on note_tags for delete
  using (exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260513000000_create_note_tables.sql
git commit -m "feat: add note domain supabase migration with RLS"
```

---

## Task 2: TypeScript 타입 정의

**Files:**
- Create: `frontend/src/types/note.ts`

- [ ] **Step 1: 타입 파일 작성**

`frontend/src/types/note.ts`

```typescript
export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type NoteLink = {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type NoteTag = {
  note_id: string;
  tag_id: string;
};

/** notes 생성 시 사용하는 입력 타입 */
export type CreateNoteInput = Pick<Note, 'title' | 'content'>;

/** notes 수정 시 사용하는 입력 타입 */
export type UpdateNoteInput = Partial<Pick<Note, 'title' | 'content'>>;
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/types/note.ts
git commit -m "feat: add note domain TypeScript types"
```

---

## Task 3: Supabase 클라이언트 설정

**Files:**
- Create: `frontend/src/lib/supabase/client.ts`

**전제:** `frontend/` 에 Next.js 프로젝트가 초기화되어 있어야 하고 `@supabase/supabase-js` 가 설치되어 있어야 한다.

```bash
# frontend/ 에서 실행
npm install @supabase/supabase-js
```

환경변수 `.env.local` (frontend/ 루트):
```
NEXT_PUBLIC_SUPABASE_URL=<Supabase 프로젝트 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
```

- [ ] **Step 1: 클라이언트 파일 작성**

`frontend/src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/lib/supabase/client.ts
git commit -m "feat: add supabase client singleton"
```

---

## Task 4: [[링크]] 파싱 유틸리티 (TDD)

**Files:**
- Create: `frontend/src/lib/note/parse-links.ts`
- Create: `frontend/src/lib/note/__tests__/parse-links.test.ts`

**전제:** `frontend/` 에 Vitest가 설치되어 있어야 한다.

```bash
# frontend/ 에서 실행
npm install -D vitest
```

`frontend/package.json` 의 scripts에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/lib/note/__tests__/parse-links.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseLinkTitles } from '../parse-links';

describe('parseLinkTitles', () => {
  it('본문에서 [[제목]] 패턴을 추출한다', () => {
    const content = '이 메모는 [[양자역학]]과 [[엔트로피]]를 연결한다.';
    expect(parseLinkTitles(content)).toEqual(['양자역학', '엔트로피']);
  });

  it('링크가 없으면 빈 배열을 반환한다', () => {
    expect(parseLinkTitles('링크 없는 메모')).toEqual([]);
  });

  it('중복된 [[링크]]는 한 번만 반환한다', () => {
    const content = '[[양자역학]] 그리고 다시 [[양자역학]]';
    expect(parseLinkTitles(content)).toEqual(['양자역학']);
  });

  it('빈 [[]] 는 무시한다', () => {
    expect(parseLinkTitles('[[]] 빈 링크')).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
# frontend/ 에서 실행
npm test
```

Expected: FAIL — `parseLinkTitles` 를 찾을 수 없음

- [ ] **Step 3: 최소 구현 작성**

`frontend/src/lib/note/parse-links.ts`

```typescript
/**
 * 메모 본문에서 [[제목]] 패턴을 추출하여 고유 제목 배열로 반환한다.
 */
export function parseLinkTitles(content: string): string[] {
  const matches = content.matchAll(/\[\[(.+?)\]\]/g);
  const titles = Array.from(matches, (m) => m[1].trim()).filter(Boolean);
  return [...new Set(titles)];
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: PASS — 4개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/lib/note/parse-links.ts frontend/src/lib/note/__tests__/parse-links.test.ts
git commit -m "feat: add [[link]] title parser with tests"
```

---

## Task 5: 노트 CRUD 함수 (TDD)

**Files:**
- Create: `frontend/src/lib/note/notes.ts`
- Create: `frontend/src/lib/note/__tests__/notes.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/lib/note/__tests__/notes.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotes, getNoteById, createNote, updateNote, deleteNote } from '../notes';

// Supabase 클라이언트 모킹
vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client';

const mockNote = {
  id: 'note-uuid-1',
  user_id: 'user-uuid-1',
  title: '양자역학 기초',
  content: '[[파동함수]]란 무엇인가',
  created_at: '2026-05-13T00:00:00Z',
  updated_at: '2026-05-13T00:00:00Z',
};

function makeChain(returnValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order:  vi.fn().mockResolvedValue(returnValue),
  };
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe('getNotes', () => {
  it('노트 목록을 최신순으로 반환한다', async () => {
    const chain = makeChain({ data: [mockNote], error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getNotes();
    expect(supabase.from).toHaveBeenCalledWith('notes');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(result).toEqual([mockNote]);
  });
});

describe('getNoteById', () => {
  it('id로 단일 노트를 반환한다', async () => {
    const chain = makeChain({ data: mockNote, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getNoteById('note-uuid-1');
    expect(chain.eq).toHaveBeenCalledWith('id', 'note-uuid-1');
    expect(result).toEqual(mockNote);
  });
});

describe('createNote', () => {
  it('새 노트를 생성하고 반환한다', async () => {
    const chain = makeChain({ data: mockNote, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await createNote({ title: '양자역학 기초', content: '[[파동함수]]란 무엇인가' });
    expect(chain.insert).toHaveBeenCalledWith({ title: '양자역학 기초', content: '[[파동함수]]란 무엇인가' });
    expect(result).toEqual(mockNote);
  });
});

describe('updateNote', () => {
  it('노트를 수정하고 반환한다', async () => {
    const updated = { ...mockNote, title: '수정된 제목' };
    const chain = makeChain({ data: updated, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await updateNote('note-uuid-1', { title: '수정된 제목' });
    expect(chain.update).toHaveBeenCalledWith({ title: '수정된 제목' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'note-uuid-1');
    expect(result).toEqual(updated);
  });
});

describe('deleteNote', () => {
  it('노트를 삭제한다', async () => {
    const chain = makeChain({ error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    await deleteNote('note-uuid-1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'note-uuid-1');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

Expected: FAIL — `getNotes` 등 함수 없음

- [ ] **Step 3: 최소 구현 작성**

`frontend/src/lib/note/notes.ts`

```typescript
import { supabase } from '../supabase/client';
import type { Note, CreateNoteInput, UpdateNoteInput } from '../../types/note';

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getNoteById(id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/lib/note/notes.ts frontend/src/lib/note/__tests__/notes.test.ts
git commit -m "feat: add note CRUD functions with tests"
```

---

## Task 6: 링크 동기화 함수 (TDD)

**Files:**
- Create: `frontend/src/lib/note/links.ts`
- Create: `frontend/src/lib/note/__tests__/links.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/lib/note/__tests__/links.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncNoteLinks, getOutgoingLinks, getBacklinks } from '../links';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../supabase/client';

function makeChain(returnValue: unknown) {
  const chain = {
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    in:      vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue(returnValue),
    then:    vi.fn().mockResolvedValue(returnValue),
  };
  // select() 체인의 최종 await 를 지원하기 위해 thenable 처리
  chain.select.mockReturnValue({ ...chain, then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve) });
  chain.eq.mockReturnValue({ ...chain, then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve) });
  chain.in.mockReturnValue({ ...chain, then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve) });
  chain.delete.mockReturnValue({ ...chain, then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve) });
  chain.insert.mockReturnValue({ ...chain, then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve) });
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe('syncNoteLinks', () => {
  it('기존 링크를 삭제하고 새 링크를 삽입한다', async () => {
    const fromMock = vi.mocked(supabase.from);

    // 1) 제목으로 id 조회 결과
    const titleLookupChain = makeChain({ data: [{ id: 'note-uuid-target', title: '파동함수' }], error: null });
    // 2) 기존 링크 삭제 결과
    const deleteChain = makeChain({ error: null });
    // 3) 새 링크 삽입 결과
    const insertChain = makeChain({ error: null });

    fromMock
      .mockReturnValueOnce(titleLookupChain as never) // notes 조회
      .mockReturnValueOnce(deleteChain as never)       // note_links 삭제
      .mockReturnValueOnce(insertChain as never);      // note_links 삽입

    await syncNoteLinks('note-uuid-source', '[[파동함수]]란 무엇인가');

    expect(fromMock).toHaveBeenNthCalledWith(1, 'notes');
    expect(fromMock).toHaveBeenNthCalledWith(2, 'note_links');
    expect(fromMock).toHaveBeenNthCalledWith(3, 'note_links');
  });

  it('링크가 없으면 삭제만 수행한다', async () => {
    const fromMock = vi.mocked(supabase.from);
    const deleteChain = makeChain({ error: null });
    fromMock.mockReturnValueOnce(deleteChain as never);

    await syncNoteLinks('note-uuid-source', '링크 없는 본문');

    // notes 조회 없이 note_links 삭제만 호출
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('note_links');
  });
});

describe('getOutgoingLinks', () => {
  it('source_note_id 기준 아웃고잉 링크를 반환한다', async () => {
    const mockLinks = [{ id: 'link-1', source_note_id: 'src', target_note_id: 'tgt', created_at: '' }];
    const chain = makeChain({ data: mockLinks, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getOutgoingLinks('src');
    expect(supabase.from).toHaveBeenCalledWith('note_links');
    expect(result).toEqual(mockLinks);
  });
});

describe('getBacklinks', () => {
  it('target_note_id 기준 백링크를 반환한다', async () => {
    const mockLinks = [{ id: 'link-2', source_note_id: 'src', target_note_id: 'tgt', created_at: '' }];
    const chain = makeChain({ data: mockLinks, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getBacklinks('tgt');
    expect(supabase.from).toHaveBeenCalledWith('note_links');
    expect(result).toEqual(mockLinks);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

Expected: FAIL — `syncNoteLinks` 등 함수 없음

- [ ] **Step 3: 최소 구현 작성**

`frontend/src/lib/note/links.ts`

```typescript
import { supabase } from '../supabase/client';
import { parseLinkTitles } from './parse-links';
import type { NoteLink } from '../../types/note';

/**
 * 노트 본문의 [[링크]]를 파싱해 note_links 테이블을 동기화한다.
 * 기존 source_note_id 링크를 전부 삭제한 뒤 새로 삽입한다.
 */
export async function syncNoteLinks(sourceNoteId: string, content: string): Promise<void> {
  const titles = parseLinkTitles(content);

  // 제목 → id 변환
  let targetIds: string[] = [];
  if (titles.length > 0) {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title')
      .in('title', titles);
    if (error) throw error;
    targetIds = (data ?? []).map((n: { id: string }) => n.id);
  }

  // 기존 링크 전체 삭제
  const { error: deleteError } = await supabase
    .from('note_links')
    .delete()
    .eq('source_note_id', sourceNoteId);
  if (deleteError) throw deleteError;

  // 새 링크 삽입 (링크가 있는 경우에만)
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
  return data;
}

export async function getBacklinks(targetNoteId: string): Promise<NoteLink[]> {
  const { data, error } = await supabase
    .from('note_links')
    .select('*')
    .eq('target_note_id', targetNoteId);
  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/lib/note/links.ts frontend/src/lib/note/__tests__/links.test.ts
git commit -m "feat: add note link sync functions with tests"
```

---

## Task 7: 태그 함수 (TDD)

**Files:**
- Create: `frontend/src/lib/note/tags.ts`
- Create: `frontend/src/lib/note/__tests__/tags.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/lib/note/__tests__/tags.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertTags, getTagsForNote } from '../tags';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../supabase/client';

const mockTag = { id: 'tag-uuid-1', user_id: 'user-1', name: '물리학', created_at: '' };

function makeChain(returnValue: unknown) {
  const chain = {
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    upsert:  vi.fn().mockReturnThis(),
    join:    vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve),
  };
  chain.select.mockReturnValue({ ...chain });
  chain.eq.mockReturnValue({ ...chain });
  chain.upsert.mockReturnValue({ ...chain, then: (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve) });
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe('upsertTags', () => {
  it('태그 이름 배열을 upsert하고 note_tags를 연결한다', async () => {
    const fromMock = vi.mocked(supabase.from);

    const upsertChain = makeChain({ data: [mockTag], error: null });
    const noteTagChain = makeChain({ error: null });

    fromMock
      .mockReturnValueOnce(upsertChain as never)   // tags upsert
      .mockReturnValueOnce(noteTagChain as never);  // note_tags insert

    await upsertTags('note-uuid-1', ['물리학']);

    expect(fromMock).toHaveBeenNthCalledWith(1, 'tags');
    expect(fromMock).toHaveBeenNthCalledWith(2, 'note_tags');
  });

  it('태그가 없으면 아무것도 하지 않는다', async () => {
    await upsertTags('note-uuid-1', []);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('getTagsForNote', () => {
  it('note_id로 태그 목록을 반환한다', async () => {
    const chain = makeChain({ data: [mockTag], error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as never);

    const result = await getTagsForNote('note-uuid-1');
    expect(supabase.from).toHaveBeenCalledWith('note_tags');
    expect(result).toEqual([mockTag]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

Expected: FAIL — `upsertTags` 등 함수 없음

- [ ] **Step 3: 최소 구현 작성**

`frontend/src/lib/note/tags.ts`

```typescript
import { supabase } from '../supabase/client';
import type { Tag } from '../../types/note';

/**
 * 태그 이름 배열을 tags 테이블에 upsert하고, note_tags에 연결한다.
 * 에이전트 자동 태그 생성 시에도 동일하게 사용한다.
 */
export async function upsertTags(noteId: string, tagNames: string[]): Promise<void> {
  if (tagNames.length === 0) return;

  // tags upsert (동일 user_id+name 이면 무시)
  const { data, error: upsertError } = await supabase
    .from('tags')
    .upsert(tagNames.map((name) => ({ name })), { onConflict: 'user_id,name' })
    .select('id');
  if (upsertError) throw upsertError;

  const tagIds = (data ?? []).map((t: { id: string }) => t.id);

  // note_tags 연결
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/lib/note/tags.ts frontend/src/lib/note/__tests__/tags.test.ts
git commit -m "feat: add tag upsert and query functions with tests"
```

---

## 완료 기준

- [ ] `supabase/migrations/20260513000000_create_note_tables.sql` 작성 완료
- [ ] `frontend/src/types/note.ts` 타입 정의 완료
- [ ] `frontend/src/lib/supabase/client.ts` 클라이언트 설정 완료
- [ ] `npm test` 전체 통과 (parse-links, notes, links, tags)
- [ ] 각 Task 커밋 완료

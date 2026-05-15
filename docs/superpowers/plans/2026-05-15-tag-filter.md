# 태그 필터링 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노트 목록 사이드바에 태그 칩 필터를 추가해 다중 선택(AND 조건)으로 노트를 필터링하고, 기존 텍스트 검색과 AND 조건으로 결합한다.

**Architecture:** 서버에서 노트를 태그와 함께 조회(`NoteWithTags[]`)해 `NoteLayout`에 전달한다. `NoteLayout`이 `selectedTags` state와 필터 로직을 소유하고, 필터된 노트와 태그 정보를 `NoteList`에 전달한다. 모든 필터링은 클라이언트에서 처리한다.

**Tech Stack:** Next.js App Router, React useState/useMemo, Supabase relational select, Tailwind CSS

---

## 파일 구조

| 파일 | 변경 유형 | 역할 |
|------|-----------|------|
| `frontend/src/types/note.ts` | 수정 | `NoteWithTags` 타입 추가 |
| `frontend/src/app/(app)/actions/note-actions.ts` | 수정 | `getNotesWithTagsAction()` 추가 |
| `frontend/src/app/(app)/page.tsx` | 수정 | 새 액션 사용, `NoteWithTags[]` 전달 |
| `frontend/src/app/(app)/_components/NoteLayout.tsx` | 수정 | `selectedTags` state, `allTags` 파생, 필터 로직 업데이트 |
| `frontend/src/app/(app)/_components/NoteList.tsx` | 수정 | 태그 칩 UI, 새 props 추가 |

신규 파일 없음.

---

## Task 1: NoteWithTags 타입 및 getNotesWithTagsAction 추가

**Files:**
- Modify: `frontend/src/types/note.ts`
- Modify: `frontend/src/app/(app)/actions/note-actions.ts`

- [ ] **Step 1: types/note.ts에 NoteWithTags 추가**

현재 파일 맨 아래에 다음을 추가한다:

```ts
export interface NoteWithTags extends Note {
  tags: Tag[]
}
```

전체 파일 최종 상태:

```ts
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface NoteTag {
  note_id: string;
  tag_id: string;
}

export interface NoteWithTags extends Note {
  tags: Tag[]
}
```

- [ ] **Step 2: note-actions.ts import 줄 업데이트**

파일 상단의 import를 다음으로 교체한다:

```ts
import type { Note, Tag, NoteWithTags } from '@/types/note'
```

- [ ] **Step 3: note-actions.ts에 getNotesWithTagsAction 추가**

`getNotesAction()` 바로 아래에 다음 함수를 추가한다:

```ts
export async function getNotesWithTagsAction(): Promise<NoteWithTags[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_tags(tags(id, name, user_id, created_at))')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((note) => ({
    id: note.id,
    user_id: note.user_id,
    title: note.title,
    content: note.content,
    created_at: note.created_at,
    updated_at: note.updated_at,
    tags: ((note.note_tags ?? []) as Array<{ tags: Tag }>).map((nt) => nt.tags),
  }))
}
```

- [ ] **Step 4: TypeScript 체크**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse/frontend && npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 5: 커밋**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse && \
git add "frontend/src/types/note.ts" \
        "frontend/src/app/(app)/actions/note-actions.ts" && \
git commit -m "feat: add NoteWithTags type and getNotesWithTagsAction"
```

---

## Task 2: page.tsx에서 새 액션 사용

**Files:**
- Modify: `frontend/src/app/(app)/page.tsx`

- [ ] **Step 1: page.tsx 전체를 다음 내용으로 교체**

```tsx
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
```

> **주의:** `NoteLayout`은 아직 `Note[]`를 기대하지만 `NoteWithTags extends Note`이므로 TypeScript는 에러 없이 통과한다. Task 3에서 `NoteLayout`의 타입을 `NoteWithTags[]`로 업데이트한다.

- [ ] **Step 2: TypeScript 체크**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse/frontend && npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse && \
git add "frontend/src/app/(app)/page.tsx" && \
git commit -m "feat: use getNotesWithTagsAction in page"
```

---

## Task 3: NoteLayout + NoteList 태그 필터 UI 구현

**Files:**
- Modify: `frontend/src/app/(app)/_components/NoteLayout.tsx`
- Modify: `frontend/src/app/(app)/_components/NoteList.tsx`

두 파일은 props 인터페이스를 공유하므로 함께 변경해야 한다.

- [ ] **Step 1: NoteLayout.tsx 전체를 다음 내용으로 교체**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/(auth)/login/actions'
import type { NoteWithTags, Tag } from '@/types/note'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { GraphView } from './GraphView'

type Tab = 'notes' | 'graph'

interface NoteLayoutProps {
  notes: NoteWithTags[]
  noteId: string | null
  userEmail: string
}

export function NoteLayout({ notes, noteId, userEmail }: NoteLayoutProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('notes')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(
    () =>
      Array.from(
        new Map(notes.flatMap((n) => n.tags).map((t) => [t.name, t])).values()
      ),
    [notes]
  )

  const filteredNotes = useMemo(() => {
    let result = notes
    if (selectedTags.length > 0) {
      result = result.filter((note) =>
        selectedTags.every((tag) => note.tags.some((t) => t.name === tag))
      )
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(q)
      )
    }
    return result
  }, [notes, selectedTags, searchQuery])

  function toggleTag(name: string) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  function clearTags() {
    setSelectedTags([])
  }

  function selectNote(id: string) {
    router.push(`/?noteId=${id}`)
  }

  function newNote() {
    router.push('/?noteId=new')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 네비게이션 */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white flex-shrink-0">
        <span className="font-bold text-sm">시냅스</span>
        <nav className="flex gap-4">
          <button
            onClick={() => setTab('notes')}
            className={`text-sm pb-0.5 ${
              tab === 'notes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📝 노트
          </button>
          <button
            onClick={() => setTab('graph')}
            className={`text-sm pb-0.5 ${
              tab === 'graph'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🕸 그래프
          </button>
        </nav>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{userEmail}</span>
          <form action={signOut}>
            <button type="submit" className="underline hover:text-white">
              로그아웃
            </button>
          </form>
        </div>
      </header>

      {/* 탭 콘텐츠 */}
      {tab === 'notes' ? (
        <div className="flex flex-1 overflow-hidden">
          <NoteList
            notes={filteredNotes}
            selectedNoteId={noteId}
            onSelect={selectNote}
            onNew={newNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={toggleTag}
            onClearTags={clearTags}
          />
          <NoteEditor
            noteId={noteId}
            allNotes={notes}
            onSaved={(id) => router.push(`/?noteId=${id}`)}
            onDeleted={() => router.push('/')}
          />
        </div>
      ) : (
        <GraphView onNodeClick={(id) => { setTab('notes'); selectNote(id) }} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: NoteList.tsx 전체를 다음 내용으로 교체**

```tsx
'use client'

import type { NoteWithTags, Tag } from '@/types/note'

interface NoteListProps {
  notes: NoteWithTags[]
  selectedNoteId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  allTags: Tag[]
  selectedTags: string[]
  onTagToggle: (name: string) => void
  onClearTags: () => void
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  onNew,
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onTagToggle,
  onClearTags,
}: NoteListProps) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">
      <div className="p-3 border-b border-slate-200 space-y-2">
        <button
          onClick={onNew}
          className="w-full bg-slate-800 text-white rounded-md py-1.5 text-sm font-medium hover:bg-slate-700"
        >
          + 새 노트
        </button>
        <div className="relative">
          <label htmlFor="note-search" className="sr-only">
            노트 검색
          </label>
          <input
            id="note-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="노트 검색..."
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm pr-7 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.name)}
                className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                  selectedTags.includes(tag.name)
                    ? 'bg-indigo-600 text-white'
                    : 'border border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-50'
                }`}
              >
                #{tag.name}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={onClearTags}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                초기화
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-4">
            {searchQuery || selectedTags.length > 0
              ? '검색 결과 없음'
              : '아직 노트가 없습니다'}
          </p>
        )}
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
              selectedNoteId === note.id
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-white border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-medium truncate">
              {note.title || '제목 없음'}
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              {note.content.replace(/<[^>]+>/g, '').slice(0, 40) || '내용 없음'}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: 테스트 실행**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse/frontend && npx vitest run
```

Expected: 기존 테스트 19개 전부 PASS.

- [ ] **Step 4: TypeScript 체크**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse/frontend && npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 5: 커밋**

```bash
cd /Users/heungjun/AIBE6/agent-coding-projects/synapse && \
git add "frontend/src/app/(app)/_components/NoteLayout.tsx" \
        "frontend/src/app/(app)/_components/NoteList.tsx" && \
git commit -m "feat: add tag filter UI with multi-select and AND logic"
```

---

## 수동 검증 체크리스트

구현 후 브라우저에서 확인:

- [ ] 태그가 달린 노트가 있을 때 사이드바 검색창 아래에 태그 칩이 보인다
- [ ] 태그 칩 클릭 시 해당 태그를 가진 노트만 필터된다
- [ ] 여러 태그 선택 시 선택된 태그를 모두 가진 노트만 표시된다 (AND 조건)
- [ ] 선택된 태그 칩은 indigo 배경으로 강조된다
- [ ] "초기화" 버튼 클릭 시 모든 태그 필터가 해제된다
- [ ] 태그 필터 + 검색어 동시 적용 시 AND 조건으로 동작한다
- [ ] 필터 결과가 0개면 "검색 결과 없음"이 표시된다
- [ ] 태그가 없는 사용자에게는 태그 칩 영역이 표시되지 않는다
- [ ] `[[링크]]` 자동완성은 필터와 무관하게 전체 노트를 보여준다

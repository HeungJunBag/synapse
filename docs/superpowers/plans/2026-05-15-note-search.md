# 노트 검색 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노트 목록 사이드바에 실시간 검색창을 추가해 제목과 본문으로 노트를 필터링한다.

**Architecture:** `NoteLayout`이 `searchQuery` state와 필터 로직을 소유하고, 필터된 노트 배열을 `NoteList`에 전달한다. `NoteList`는 검색 input UI를 렌더링하고 변경사항을 콜백으로 올려보낸다. DB 쿼리 없이 클라이언트에서 이미 로드된 데이터를 필터링한다.

**Tech Stack:** Next.js App Router, React useState, Tailwind CSS

---

## 파일 구조

| 파일 | 변경 유형 | 역할 |
|------|-----------|------|
| `frontend/src/app/(app)/_components/NoteList.tsx` | 수정 | 검색 input UI, `searchQuery`/`onSearchChange` prop 추가 |
| `frontend/src/app/(app)/_components/NoteLayout.tsx` | 수정 | `searchQuery` state, 필터 로직, NoteList에 prop 전달 |

신규 파일 없음.

---

## Task 1: NoteList에 검색 UI 추가

**Files:**
- Modify: `frontend/src/app/(app)/_components/NoteList.tsx`

- [ ] **Step 1: NoteList.tsx 전체를 다음 내용으로 교체**

```tsx
'use client'

import type { Note } from '@/types/note'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function NoteList({ notes, selectedNoteId, onSelect, onNew, searchQuery, onSearchChange }: NoteListProps) {
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
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="노트 검색..."
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm pr-7 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.length === 0 && !searchQuery && (
          <p className="text-xs text-slate-400 text-center mt-4">
            아직 노트가 없습니다
          </p>
        )}
        {notes.length === 0 && searchQuery && (
          <p className="text-xs text-slate-400 text-center mt-4">
            검색 결과 없음
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
              {(note.content ?? '').replace(/<[^>]+>/g, '').slice(0, 40) || '내용 없음'}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
```

> **주의:** `notes` prop은 NoteLayout에서 이미 필터된 배열이다. NoteList는 필터링하지 않는다.
> `notes.length === 0 && searchQuery` 조건은 "검색 결과 없음"을 보여주기 위해 searchQuery prop이 필요하다.

---

## Task 2: NoteLayout에 searchQuery state 및 필터 로직 추가

**Files:**
- Modify: `frontend/src/app/(app)/_components/NoteLayout.tsx`

- [ ] **Step 1: NoteLayout.tsx 전체를 다음 내용으로 교체**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/(auth)/login/actions'
import type { Note } from '@/types/note'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { GraphView } from './GraphView'

type Tab = 'notes' | 'graph'

interface NoteLayoutProps {
  notes: Note[]
  noteId: string | null
  userEmail: string
}

export function NoteLayout({ notes, noteId, userEmail }: NoteLayoutProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('notes')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNotes = searchQuery
    ? notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

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

> **주의:** `NoteEditor`의 `allNotes`에는 필터되지 않은 원본 `notes`를 전달한다. `[[링크]]` 자동완성은 전체 노트를 대상으로 동작해야 하기 때문이다.

---

## Task 3: 기존 테스트 통과 확인 및 커밋

**Files:**
- Test: `frontend/src/app/(app)/__tests__/note-actions.test.ts`

- [ ] **Step 1: 테스트 실행**

```bash
cd frontend && npx vitest run
```

Expected: 기존 테스트 19개 전부 PASS. 새로운 실패 없음.

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/\(app\)/_components/NoteList.tsx \
        frontend/src/app/\(app\)/_components/NoteLayout.tsx
git commit -m "feat: add real-time note search in sidebar"
```

---

## 수동 검증 체크리스트

구현 후 브라우저에서 확인:

- [ ] 사이드바에 "새 노트" 버튼 아래 검색창이 보인다
- [ ] 제목을 입력하면 해당 제목을 포함한 노트만 목록에 남는다
- [ ] 본문 내용을 입력해도 해당 노트가 필터된다
- [ ] 검색어 입력 시 `×` 버튼이 나타난다
- [ ] `×` 클릭 시 검색어가 지워지고 전체 목록이 복원된다
- [ ] 매칭되는 노트가 없으면 "검색 결과 없음"이 표시된다
- [ ] 검색 중에도 "새 노트" 버튼과 노트 선택/편집이 정상 동작한다
- [ ] `[[링크]]` 자동완성은 검색 필터와 무관하게 전체 노트 목록을 보여준다

# 모바일 반응형 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일(768px 미만)에서 슬라이드 드로어 방식의 반응형 레이아웃을 구현한다.

**Architecture:** NoteLayout.tsx에 `drawerOpen` 상태를 추가하고, 모바일 헤더를 2행 구조로 재구성한다. NoteList는 모바일에서 슬라이드 드로어 안에, 데스크탑에서는 기존 사이드바 위치에 렌더링된다. Tailwind `md:` 브레이크포인트(768px)로 레이아웃을 분기한다.

**Tech Stack:** Next.js 16 App Router, React, Tailwind CSS, TypeScript

---

## 파일 구조

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/src/app/(app)/_components/NoteLayout.tsx` | drawerOpen 상태, 헤더 재구조화, 드로어 오버레이 추가 |
| `frontend/src/app/(app)/_components/NoteList.tsx` | aside 클래스를 드로어 컨텍스트에 맞게 조정 |

---

### Task 1: NoteLayout — drawerOpen 상태 및 헤더 재구조화

**Files:**
- Modify: `frontend/src/app/(app)/_components/NoteLayout.tsx`

현재 파일 전체 내용 (참고용):
```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
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

  const toggleTag = useCallback((name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }, [])

  const clearTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  const selectNote = useCallback((id: string) => {
    router.push(`/?noteId=${id}`)
  }, [router])

  const newNote = useCallback(() => {
    router.push('/?noteId=new')
  }, [router])

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

- [ ] **Step 1: NoteLayout.tsx 전체를 아래 내용으로 교체한다**

```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
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
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const toggleTag = useCallback((name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }, [])

  const clearTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  const selectNote = useCallback(
    (id: string) => {
      setDrawerOpen(false)
      router.push(`/?noteId=${id}`)
    },
    [router]
  )

  const newNote = useCallback(() => {
    setDrawerOpen(false)
    router.push('/?noteId=new')
  }, [router])

  const noteListProps = {
    notes: filteredNotes,
    selectedNoteId: noteId,
    onSelect: selectNote,
    onNew: newNote,
    searchQuery,
    onSearchChange: setSearchQuery,
    allTags,
    selectedTags,
    onTagToggle: toggleTag,
    onClearTags: clearTags,
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ─── 헤더 ─── */}
      <header className="flex-shrink-0 bg-slate-800 text-white">
        {/* 1행: 햄버거(모바일) | 시냅스 | 이메일+로그아웃 */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* 햄버거 버튼 — 모바일만 */}
          <button
            className="md:hidden text-slate-300 hover:text-white text-xl leading-none"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
          >
            ☰
          </button>

          {/* 로고 */}
          <span className="font-bold text-sm">시냅스</span>

          {/* 데스크탑 탭 — md 이상에서만 표시 */}
          <nav className="hidden md:flex gap-4">
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

          {/* 이메일 + 로그아웃 */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:block">{userEmail}</span>
            <form action={signOut}>
              <button type="submit" className="underline hover:text-white">
                로그아웃
              </button>
            </form>
          </div>
        </div>

        {/* 2행: 모바일 탭바 — md 미만에서만 표시 */}
        <div className="md:hidden flex border-t border-slate-700">
          <button
            onClick={() => setTab('notes')}
            className={`flex-1 py-2 text-sm ${
              tab === 'notes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400'
            }`}
          >
            📝 노트
          </button>
          <button
            onClick={() => setTab('graph')}
            className={`flex-1 py-2 text-sm ${
              tab === 'graph'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400'
            }`}
          >
            🕸 그래프
          </button>
        </div>
      </header>

      {/* ─── 탭 콘텐츠 ─── */}
      {tab === 'notes' ? (
        <div className="flex flex-1 overflow-hidden relative">
          {/* 백드롭 — 모바일, drawerOpen일 때만 */}
          {drawerOpen && (
            <button
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-label="메뉴 닫기"
            />
          )}

          {/* 모바일 슬라이드 드로어 */}
          <div
            className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 md:hidden ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <NoteList {...noteListProps} />
          </div>

          {/* 데스크탑 사이드바 */}
          <div className="hidden md:flex">
            <NoteList {...noteListProps} />
          </div>

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

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/(app)/_components/NoteLayout.tsx
git commit -m "feat: add mobile responsive layout with slide drawer"
```

---

### Task 2: NoteList — 드로어 컨텍스트에서 레이아웃 정상화

**Files:**
- Modify: `frontend/src/app/(app)/_components/NoteList.tsx`

현재 NoteList의 `aside` 태그:
```tsx
<aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">
```

드로어 안에서 렌더링될 때 `w-60`이 드로어 너비(`w-64`)와 충돌해 스크롤이 생길 수 있다.
드로어는 `w-64`이고 NoteList가 `w-60`이면 오른쪽에 공백이 남는다.
`w-full h-full`로 변경해서 컨텍스트(드로어 or 사이드바)에 맞게 늘어나도록 한다.

- [ ] **Step 1: NoteList.tsx의 aside 클래스 수정**

파일: `frontend/src/app/(app)/_components/NoteList.tsx`

변경 전:
```tsx
<aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">
```

변경 후:
```tsx
<aside className="w-full h-full flex flex-col border-r border-slate-200 bg-slate-50">
```

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: lint 체크**

```bash
cd frontend && npm run lint
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/app/(app)/_components/NoteList.tsx
git commit -m "feat: make NoteList fill its container for drawer compatibility"
```

---

### Task 3: 수동 검증 및 최종 커밋

**Files:** (없음 — 코드 변경 없음)

이 Task는 모바일 반응형이 실제로 동작하는지 수동으로 확인하는 단계다.

- [ ] **Step 1: dev 서버 확인**

이미 실행 중이라면 그대로 사용:
```bash
cd frontend && npm run dev
```

브라우저에서 `http://localhost:3000` 열기

- [ ] **Step 2: 모바일 뷰 확인 체크리스트**

Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M) → iPhone SE (375px) 선택

확인 항목:
1. ☰ 햄버거 버튼이 헤더 왼쪽에 표시된다
2. 이메일 주소가 헤더에서 숨겨진다
3. 헤더 2행에 📝 노트 / 🕸 그래프 탭이 표시된다
4. ☰ 클릭 → NoteList가 왼쪽에서 슬라이드인 된다
5. 백드롭(어두운 배경) 클릭 → 드로어가 닫힌다
6. 노트 선택 → 드로어가 닫히고 에디터가 표시된다
7. 🕸 그래프 탭 클릭 → 그래프 뷰로 전환된다

- [ ] **Step 3: 데스크탑 뷰 확인 체크리스트**

DevTools에서 반응형 모드 해제 → 기본 브라우저 너비

확인 항목:
1. ☰ 버튼이 보이지 않는다
2. 헤더에 탭 버튼(📝 노트, 🕸 그래프)이 중앙에 표시된다
3. 이메일 주소가 오른쪽에 표시된다
4. 사이드바 + 에디터 좌우 분할 레이아웃이 그대로다

- [ ] **Step 4: TypeScript + lint 최종 확인**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: 에러 없음

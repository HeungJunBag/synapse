# 노트 UI 설계

**날짜**: 2026-05-13
**상태**: 승인됨
**관련 문서**: `docs/DOMAIN-NOTE-CONSTITUTION.md`, `docs/DOMAIN-NOTE-STATUTE.md`

---

## 1. 배경 및 목표

노트 도메인의 DB 스키마와 데이터 접근 레이어(`lib/note/`)는 완성된 상태다. 이 설계는 사용자가 실제로 노트를 작성하고 연결을 탐색할 수 있는 프론트엔드 UI를 구축한다.

**구현 범위:**
- 노트 CRUD (목록, 생성, 편집, 삭제)
- TipTap 리치 에디터 + `[[링크]]` 자동완성 및 렌더링
- 아웃고잉 링크 + 백링크 표시
- 태그 표시
- react-force-graph 기반 노트 연결 그래프 뷰

---

## 2. 핵심 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 레이아웃 | 탭 전환 (노트 탭 + 그래프 탭) | 심플함 유지하면서 그래프 뷰 제공 |
| 에디터 | TipTap | `[[링크]]` 커스텀 확장, 마크다운 렌더링 지원 |
| 그래프 라이브러리 | react-force-graph | force-directed, 설치 간단, Obsidian 유사 UX |
| 노트 선택 | URL searchParams `?noteId=xxx` | 새로고침 후에도 상태 유지 |
| 데이터 페칭 | 초기 목록은 Server Component, 상세는 Server Action | 첫 로드 성능 + 클라이언트 상호작용 분리 |

---

## 3. 파일 구조

```
frontend/src/app/(app)/
  page.tsx                          # Server Component: 노트 목록 fetch → NoteLayout 전달
  _components/
    NoteLayout.tsx                  # 'use client': 탭 전환, noteId 상태 관리
    NoteList.tsx                    # 좌측 패널: 노트 목록, 새 노트 버튼, 태그 표시
    NoteEditor.tsx                  # 우측 패널: TipTap 에디터, 저장/삭제 버튼
    NoteLinks.tsx                   # 에디터 하단: 아웃고잉 링크 + 백링크 칩
    GraphView.tsx                   # 그래프 탭: react-force-graph
  actions/
    note-actions.ts                 # Server Actions: create, update, delete, getNote, getLinks, getGraphData
```

---

## 4. 데이터 흐름

### 페이지 초기 로드
```
page.tsx (Server Component)
  → getNotes() 호출 (기존 lib/note/notes.ts)
  → NoteLayout에 notes 배열 props로 전달
  → URL searchParams에 noteId 있으면 NoteEditor에 자동 로드
```

### 노트 선택
```
NoteList에서 노트 클릭
  → URL: /?noteId=xxx 업데이트 (router.push)
  → NoteEditor: getNote(noteId) Server Action 호출
  → NoteLinks: getOutgoingLinks + getBacklinks Server Action 호출
```

### 노트 저장 (생성/수정)
```
TipTap 에디터에서 저장 버튼 클릭
  → parseLinkTitles(content)로 [[링크]] 제목 추출
  → createNote() 또는 updateNote() Server Action 호출
  → syncNoteLinks(noteId, titles) Server Action 호출
  → router.refresh()로 목록 갱신
```

### 노트 삭제
```
삭제 버튼 클릭 → 확인 → deleteNote() Server Action
  → router.refresh() + noteId 초기화 (목록으로 복귀)
```

### 그래프 뷰
```
그래프 탭 클릭
  → getGraphData() Server Action 호출
  → { nodes: [{id, title}], links: [{source, target}] } 형태로 변환
  → react-force-graph에 전달
  → 노드 클릭 → /?noteId=xxx + 노트 탭으로 이동
```

---

## 5. TipTap [[링크]] 처리

### 커스텀 Mark 확장
- `[[` 입력 감지 → 기존 노트 목록으로 자동완성 드롭다운 표시
- 목록에서 선택 시 `[[노트 제목]]` 텍스트 삽입
- 저장된 `[[노트 제목]]` 패턴은 파란색 칩으로 렌더링

### 저장 시 링크 동기화
- `parseLinkTitles(content)` — 이미 구현된 함수로 `[[...]]` 패턴 추출
- 추출된 제목으로 `syncNoteLinks()` 호출 (delete-then-insert 방식)

---

## 6. Server Actions (`note-actions.ts`)

| Action | 기반 함수 | 설명 |
|--------|-----------|------|
| `createNoteAction(title, content)` | `createNote` + `syncNoteLinks` | 노트 생성 + 링크 동기화 |
| `updateNoteAction(id, title, content)` | `updateNote` + `syncNoteLinks` | 노트 수정 + 링크 재동기화 |
| `deleteNoteAction(id)` | `deleteNote` | 노트 삭제 (링크 cascade) |
| `getNoteAction(id)` | `getNoteById` + `getTagsForNote` | 노트 상세 + 태그 |
| `getLinksAction(id)` | `getOutgoingLinks` + `getBacklinks` | 양방향 링크 |
| `getGraphDataAction()` | `getNotes` + `note_links` 전체 조회 | 그래프용 nodes + links |

---

## 7. 에러 처리

| 상황 | 처리 |
|------|------|
| 노트 저장 실패 | 에디터 상단 에러 메시지, 내용 유지 |
| 노트 로드 실패 | 우측 패널 "불러오기 실패" 표시 |
| 그래프 데이터 없음 | "노트를 작성하면 그래프가 표시됩니다" 빈 상태 |

---

## 8. 테스트 전략

- **Server Actions** (`note-actions.ts`): Vitest + Proxy mock — 기존 `lib/note/` 테스트 패턴과 동일
- **TipTap, GraphView**: DOM 의존성으로 단위 테스트 제외 → dev server E2E 수동 검증
- **parseLinkTitles**: 이미 테스트 완료, 재사용

---

## 9. 범위 외

- 노트 검색/필터
- 태그로 노트 필터링
- 모바일 반응형
- AI 자동 태그 생성

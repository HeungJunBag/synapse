# 태그 필터링 기능 설계

날짜: 2026-05-15

---

## 개요

노트 목록 사이드바의 검색창 아래에 태그 칩 필터를 추가한다. 태그를 다중 선택(AND 조건)할 수 있으며, 기존 텍스트 검색과 AND 조건으로 결합된다.

---

## 요구사항

- 태그 칩을 다중 선택 가능 (AND 조건: 선택된 태그를 모두 가진 노트만 표시)
- 태그 필터 + 텍스트 검색은 AND 조건으로 결합
- 태그 칩 위치: 사이드바 검색창 아래
- 태그가 없으면 칩 영역 숨김
- 선택된 태그 있을 때 "초기화" 버튼 표시
- 클라이언트 사이드 필터링 (DB 쿼리 없음)

---

## 데이터 계층

### 새 타입: `NoteWithTags`

`frontend/src/types/note.ts`에 추가:

```ts
export interface NoteWithTags extends Note {
  tags: Tag[]
}
```

### 새 서버 액션: `getNotesWithTagsAction()`

`frontend/src/app/(app)/actions/note-actions.ts`에 추가:

```ts
export async function getNotesWithTagsAction(): Promise<NoteWithTags[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_tags(tags(id, name, user_id, created_at))')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((note) => ({
    ...note,
    tags: (note.note_tags ?? []).map((nt: { tags: Tag }) => nt.tags),
  }))
}
```

### `page.tsx` 변경

- `getNotesWithTagsAction()` 사용 (기존 인라인 쿼리 대체)
- `notes` 타입을 `NoteWithTags[]`로 변경

---

## 아키텍처

```
page.tsx (서버)
  → getNotesWithTagsAction() → NoteWithTags[]
  → NoteLayout (notes: NoteWithTags[], ...)

NoteLayout (클라이언트)
  → selectedTags state
  → allTags (notes에서 파생, 중복 제거)
  → filteredNotes (useMemo: selectedTags AND searchQuery)
  → NoteList (allTags, selectedTags, onTagToggle, ...)
```

---

## 상태 및 필터 로직 (NoteLayout)

```ts
const [selectedTags, setSelectedTags] = useState<string[]>([])

const allTags = useMemo(
  () => Array.from(
    new Map(notes.flatMap(n => n.tags).map(t => [t.name, t])).values()
  ),
  [notes]
)

const filteredNotes = useMemo(() => {
  let result = notes
  if (selectedTags.length > 0) {
    result = result.filter(note =>
      selectedTags.every(tag => note.tags.some(t => t.name === tag))
    )
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    result = result.filter(note =>
      note.title.toLowerCase().includes(q) ||
      note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(q)
    )
  }
  return result
}, [notes, selectedTags, searchQuery])

function toggleTag(name: string) {
  setSelectedTags(prev =>
    prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
  )
}
```

---

## UI 상세 (NoteList)

새 props:
- `allTags: Tag[]` — 전체 고유 태그 목록
- `selectedTags: string[]` — 선택된 태그 이름 배열
- `onTagToggle: (name: string) => void` — 태그 토글 콜백

태그 칩 렌더링:
- `allTags.length > 0`일 때만 칩 영역 표시
- 미선택: `border border-indigo-200 text-indigo-600 bg-white` 스타일
- 선택됨: `bg-indigo-600 text-white` 스타일
- `selectedTags.length > 0`일 때 "초기화" 버튼 표시 → 클릭 시 `selectedTags` 전체 해제

---

## 변경 파일

| 파일 | 변경 유형 |
|------|-----------|
| `frontend/src/types/note.ts` | `NoteWithTags` 타입 추가 |
| `frontend/src/app/(app)/actions/note-actions.ts` | `getNotesWithTagsAction()` 추가 |
| `frontend/src/app/(app)/page.tsx` | 새 액션 사용, `NoteWithTags[]` 타입 적용 |
| `frontend/src/app/(app)/_components/NoteLayout.tsx` | `selectedTags` state, `allTags` 파생, 필터 로직 업데이트 |
| `frontend/src/app/(app)/_components/NoteList.tsx` | 태그 칩 UI 추가, 새 props |

신규 파일 없음.

---

## 테스트

기존 테스트 19개 회귀 없이 통과해야 한다. 필터 로직은 인라인 useMemo 수준이므로 별도 단위 테스트 작성하지 않는다.

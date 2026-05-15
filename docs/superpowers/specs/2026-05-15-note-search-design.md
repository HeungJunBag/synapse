# 노트 검색 기능 설계

날짜: 2026-05-15

---

## 개요

노트 목록 사이드바에 실시간 검색창을 추가한다. 제목과 본문을 동시에 검색하며, 클라이언트에서 이미 로드된 노트 배열을 필터링하는 방식으로 동작한다.

---

## 요구사항

- 검색 범위: 제목(title) + 본문(content) 동시 검색
- 검색 UX: 입력 즉시 실시간 필터링 (DB 쿼리 없음)
- 검색창 위치: 노트 목록 사이드바 상단 ("새 노트" 버튼 아래)

---

## 아키텍처

```
NoteLayout (searchQuery state, 필터 로직)
  → 필터된 notes + onSearchChange → NoteList (검색 input UI)
```

`NoteLayout`이 `searchQuery` state를 소유하고, `notes` 배열을 필터링한 뒤 `NoteList`에 전달한다. `NoteList`는 검색 input UI를 렌더링하고 변경사항을 `onSearchChange` 콜백으로 올려보낸다.

---

## 변경 파일

### `frontend/src/app/(app)/_components/NoteLayout.tsx`

- `searchQuery` state 추가 (`useState<string>('')`)
- 필터 로직 추가
- `NoteList`에 `searchQuery`, `onSearchChange` prop 전달

### `frontend/src/app/(app)/_components/NoteList.tsx`

- `searchQuery: string` prop 추가
- `onSearchChange: (q: string) => void` prop 추가
- 사이드바 상단에 검색 input 렌더링
- 검색어가 있을 때 `[x]` 클리어 버튼 표시
- 검색 결과 0개 시 "검색 결과 없음" 메시지

---

## 필터 로직

```ts
const filtered = notes.filter(note =>
  note.title.toLowerCase().includes(query.toLowerCase()) ||
  note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(query.toLowerCase())
)
```

`content`는 TipTap이 생성한 HTML이므로 태그를 제거한 뒤 검색한다. (`NoteList`의 미리보기 렌더링에서 이미 동일한 방식을 사용 중)

빈 검색어(`''`)일 때는 전체 노트를 반환한다.

---

## UI 상세

- 검색 input: `placeholder="노트 검색..."`
- 검색어가 있을 때 우측에 `×` 버튼 표시 → 클릭 시 검색어 초기화
- 검색 결과 0개: `"검색 결과 없음"` 텍스트 표시
- 기존 `"아직 노트가 없습니다"` 메시지는 전체 notes가 빈 경우에만 표시

---

## 신규 파일

없음.

---

## 테스트

필터 로직은 인라인 one-liner 수준이므로 별도 단위 테스트를 작성하지 않는다. 기존 테스트 19개가 회귀 없이 통과해야 한다.

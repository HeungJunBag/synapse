# 시냅스 (Synapse) 기획안

**작성일:** 2026-05-14  
**최종 수정:** 2026-05-15  
**현재 버전:** v0.2

---

## 1. 프로젝트 개요

### 1-1. 한 줄 소개

> 생각과 생각을 연결하는 제텔카스텐 기반 개인 지식 관리 도구

### 1-2. 문제 정의

기존 노트 앱(Notion, Bear 등)은 정보를 **폴더/계층 구조**로 저장한다. 이 방식은 아이디어 간의 **연결과 관계**를 표현하지 못한다. 생각은 선형이 아니라 그물망 구조로 발전한다.

### 1-3. 솔루션

제텔카스텐(Zettelkasten) 방법론을 적용한다.

- **원자성**: 노트 하나에 생각 하나만 담는다
- **연결성**: `[[노트 제목]]` 형태로 노트 간 링크를 걸어 지식을 그물망으로 엮는다
- **시각화**: 연결 관계를 그래프로 시각화해 전체 지식 지형을 한눈에 파악한다

---

## 2. 타깃 사용자

| 유형 | 설명 |
|------|------|
| 연구자 / 학생 | 논문, 강의 내용을 연결하며 정리하고 싶은 사람 |
| 개발자 | 기술 개념, 문서, 아이디어를 연결하며 관리하고 싶은 사람 |
| 지식 노동자 | 업무 중 발생하는 인사이트를 체계적으로 축적하고 싶은 사람 |

---

## 3. 기능 목록

### 구현 완료

| 기능 | 설명 | 버전 |
|------|------|------|
| 회원가입 / 로그인 | 이메일 + 패스워드, Supabase Auth | v0.1 |
| 노트 CRUD | 생성, 편집(TipTap 리치 에디터), 삭제 | v0.1 |
| `[[링크]]` 자동완성 | 에디터에서 `[[` 입력 시 기존 노트 드롭다운 | v0.1 |
| 링크 자동 동기화 | 저장 시 `[[링크]]` 파싱 → `note_links` 자동 갱신 | v0.1 |
| 아웃고잉 링크 패널 | 현재 노트에서 연결된 노트 목록 | v0.1 |
| 백링크 패널 | 현재 노트를 참조하는 노트 목록 | v0.1 |
| 그래프 뷰 | 노트 간 연결을 force-directed 그래프로 시각화 | v0.1 |
| 그래프 → 노트 이동 | 그래프 노드 클릭 시 해당 노트로 이동 | v0.1 |
| 노트 검색 | 사이드바 실시간 검색 (제목 + 본문, 클라이언트 필터링) | v0.2 |
| 태그 필터링 | 다중 선택 AND 조건, 검색과 동시 적용 | v0.2 |
| 모바일 반응형 | 슬라이드 드로어, 2행 헤더 (Tailwind md 브레이크포인트) | v0.2 |

### 미구현 (예정)

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| AI 자동 태그 생성 | 노트 저장 시 LLM 기반 태그 자동 추천 | 높음 |
| Vercel 배포 | 프로덕션 환경 배포 | 높음 |
| 노트 공유 | 특정 노트를 링크로 공유 (읽기 전용) | 낮음 |
| 마크다운 내보내기 | 노트를 .md 파일로 다운로드 | 낮음 |

---

## 4. 기술 스택

### 4-1. 스택 목록 및 선택 이유

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| Frontend 프레임워크 | Next.js | 16.2.6 | App Router + Server Actions로 별도 API 서버 없이 풀스택 구성 가능 |
| UI 런타임 | React | 19.2.4 | Next.js 기본 런타임 |
| 에디터 | TipTap | 3.23.x | ProseMirror 기반 확장성, `[[링크]]` 자동완성 커스텀 Extension 구현 용이 |
| 그래프 시각화 | react-force-graph-2d | 1.29.x | Canvas 기반 force-directed 그래프, 노드/링크 인터랙션 지원 |
| Backend / DB | Supabase | 2.105.x | PostgreSQL + Auth + RLS를 한 번에 제공, 로컬 Docker 개발 환경 지원 |
| Styling | Tailwind CSS | 4.x | 유틸리티 클래스 기반, 반응형 브레이크포인트(`md:`) 처리 간결 |
| 테스트 | Vitest | 4.1.x | Vite 기반 빠른 실행, TypeScript 네이티브 지원 |
| 언어 | TypeScript | 5.x | 엄격한 타입 검사로 Server Actions 타입 안전성 확보 |

### 4-2. 주요 의존성 관계

```
Next.js (App Router)
  ├── Server Components  →  Supabase server client (@supabase/ssr)
  ├── Server Actions     →  Supabase server client
  └── Client Components →  TipTap, react-force-graph-2d, Supabase browser client
```

---

## 5. 아키텍처 및 폴더 구조

### 5-1. 전체 구조

```
synapse/
├── frontend/              # Next.js 앱
│   └── src/
│       ├── app/
│       │   ├── (app)/     # 인증 필요 라우트 그룹
│       │   │   ├── _components/   # 페이지 전용 컴포넌트
│       │   │   ├── actions/       # Server Actions (note-actions.ts)
│       │   │   ├── __tests__/     # Server Actions 테스트
│       │   │   ├── layout.tsx     # 인증 검증 레이아웃
│       │   │   └── page.tsx       # 메인 페이지 (서버 컴포넌트)
│       │   ├── (auth)/    # 미인증 라우트 그룹
│       │   │   └── login/
│       │   │       ├── actions.ts  # signIn, signUp, signOut
│       │   │       └── page.tsx
│       │   ├── globals.css
│       │   └── layout.tsx         # 루트 레이아웃
│       ├── lib/
│       │   ├── note/              # 노트 도메인 순수 로직 (테스트 가능)
│       │   │   ├── parse-links.ts
│       │   │   ├── notes.ts
│       │   │   ├── links.ts
│       │   │   ├── tags.ts
│       │   │   └── __tests__/
│       │   └── supabase/
│       │       ├── client.ts      # 브라우저 클라이언트
│       │       └── server.ts      # 서버 클라이언트 (cookies 기반)
│       ├── proxy.ts               # 라우트 보호 (Next.js 16 proxy 컨벤션)
│       └── types/
│           └── note.ts            # 공유 TypeScript 타입
└── supabase/
    └── migrations/                # DB 마이그레이션 파일
```

### 5-2. 컴포넌트 구조

```
page.tsx (서버 컴포넌트)
  └── NoteLayout (클라이언트 컴포넌트) — 탭/검색/태그 상태 관리
        ├── NoteList — 사이드바 (검색 입력, 태그 칩, 노트 목록)
        ├── NoteEditor — TipTap 에디터
        │     ├── WikiLinkExtension — [[링크]] 자동완성 TipTap Extension
        │     ├── WikiLinkList — 자동완성 드롭다운 UI
        │     └── NoteLinks — 아웃고잉/백링크/태그 패널
        └── GraphView — force-directed 그래프
```

---

## 6. 데이터 구조

### 6-1. 테이블 요약

| 테이블 | 역할 |
|--------|------|
| `notes` | 노트 본문 저장 |
| `note_links` | 노트 간 단방향 링크 (`[[링크]]` 파싱 결과) |
| `tags` | 태그 마스터 목록 (user_id 범위 내 유일) |
| `note_tags` | 노트-태그 다대다 조인 |

모든 테이블에 RLS 적용. 사용자는 자신의 `user_id`와 일치하는 행에만 접근 가능.

### 6-2. ERD (텍스트)

```
auth.users (Supabase 관리)
    │
    ├──< notes (user_id FK)
    │       │
    │       ├──< note_links (source_note_id FK, target_note_id FK)
    │       │
    │       └──< note_tags (note_id FK)
    │                │
    └──< tags ───────┘ (tag_id FK)
        (user_id FK)
```

### 6-3. TypeScript 타입

```typescript
// 기본 노트
interface Note {
  id: string
  user_id: string
  title: string
  content: string      // HTML (TipTap 출력)
  created_at: string
  updated_at: string
}

// 태그 포함 노트 (사이드바 / 필터링용)
interface NoteWithTags extends Note {
  tags: Tag[]
}

interface Tag {
  id: string
  user_id: string
  name: string
  created_at: string
}
```

---

## 7. Server Actions 명세

### 7-1. 인증 (`src/app/(auth)/login/actions.ts`)

| 액션 | 인자 | 반환 | 설명 |
|------|------|------|------|
| `signIn` | `FormData` (email, password) | `{ error: string }` 또는 redirect | 로그인 성공 시 `/` 리다이렉트 |
| `signUp` | `FormData` (email, password) | `{ error: string }` 또는 redirect | 가입 성공 시 `/` 리다이렉트 |
| `signOut` | 없음 | redirect | 로그아웃 후 `/login` 리다이렉트 |

### 7-2. 노트 (`src/app/(app)/actions/note-actions.ts`)

| 액션 | 인자 | 반환 | 설명 |
|------|------|------|------|
| `getNotesAction` | 없음 | `Note[]` | 로그인 사용자의 노트 목록 (최신순) |
| `getNotesWithTagsAction` | 없음 | `NoteWithTags[]` | 태그 포함 노트 목록 (사이드바용) |
| `getNoteAction` | `id: string` | `Note` | 단일 노트 조회 |
| `createNoteAction` | `title, content` | `Note` | 노트 생성 + `note_links` 동기화 |
| `updateNoteAction` | `id, title, content` | `Note` | 노트 수정 + `note_links` 동기화 |
| `deleteNoteAction` | `id: string` | `void` | 노트 삭제 (cascade로 links/tags 자동 삭제) |
| `getLinksAction` | `noteId: string` | `{ outgoing, backlinks }` | 아웃고잉 링크 + 백링크 목록 |
| `getTagsAction` | `noteId: string` | `Tag[]` | 노트에 연결된 태그 목록 |
| `getGraphDataAction` | 없음 | `{ nodes, links }` | 그래프 뷰용 전체 노드/엣지 데이터 |

---

## 8. 비기능 요구사항

### 보안

- 모든 Supabase 테이블에 RLS 활성화 — 사용자는 자신의 데이터에만 접근 가능
- 세션은 쿠키 기반 관리 (`@supabase/ssr`) — localStorage 사용 금지
- 라우트 보호는 서버 단(`proxy.ts`)에서 처리 — 클라이언트 단 보호만으로는 불충분
- Server Actions에서 `supabase.auth.getUser()` 호출로 매 요청 인증 검증

### 접근성

- 검색 입력창: `<label htmlFor>` + `sr-only` 클래스로 스크린 리더 지원
- 태그 필터 칩: `aria-pressed` 속성으로 선택 상태 전달
- 모바일 드로어 버튼: `aria-label="메뉴 열기/닫기"` 명시
- 백드롭 오버레이: `<button>` 요소로 키보드 접근 가능

### 반응형

- 브레이크포인트: Tailwind `md` (768px)
- 768px 미만: 슬라이드 드로어 방식, 2행 헤더
- 768px 이상: 사이드바 고정, 1행 헤더 (기존 레이아웃)

### 성능

- 노트 검색/태그 필터링: 클라이언트 사이드 필터링 (추가 API 호출 없음)
- 그래프 데이터: 탭 전환 시 서버에서 로드 (Canvas 기반 렌더링)

---

## 9. 개발 환경 세팅

### Prerequisites

- Node.js 20+
- Docker Desktop (Supabase 로컬 개발용)
- Supabase CLI

### 로컬 실행

```bash
# 1. 의존성 설치
cd frontend && npm install

# 2. Supabase 로컬 서버 시작 (Docker 필요)
supabase start

# 3. 환경변수 설정 (supabase start 출력값 참고)
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# 4. 개발 서버 시작
cd frontend && npm run dev
# → http://localhost:3000
```

### 테스트 실행

```bash
cd frontend

# 전체 테스트 1회 실행
npm test

# 워치 모드
npm run test:watch
```

현재 테스트 커버리지:
- `lib/note/parse-links.ts` — 4 tests
- `lib/note/notes.ts` — 5 tests
- `lib/note/links.ts` — 4 tests
- `lib/note/tags.ts` — 3 tests
- `app/(app)/actions/note-actions.ts` — 통합 테스트

---

## 10. 배포 아키텍처 (예정)

```
사용자 브라우저
      │
      ▼
  Vercel (Next.js)
  ├── 정적 파일 CDN
  ├── Server Components / Server Actions
  └── proxy.ts (라우트 보호)
      │
      ▼
  Supabase (hosted)
  ├── PostgreSQL DB (notes, note_links, tags, note_tags)
  ├── Auth (이메일/패스워드 세션)
  └── RLS (사용자별 데이터 격리)
```

**환경변수 (Vercel 설정 필요):**

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 |

---

## 11. 화면 명세

### 11-1. 인증 도메인

---

#### [AUTH-01] 로그인 화면

**경로:** `/login`  
**접근 조건:** 미인증 사용자만. 인증된 사용자는 `/`로 리다이렉트.

| 영역 | 구성 요소 | 동작 |
|------|-----------|------|
| 상단 | 앱 로고 (시냅스) | — |
| 폼 | 이메일 입력 | 텍스트 입력 |
| 폼 | 패스워드 입력 | 마스킹 텍스트 입력 |
| 폼 | 로그인 버튼 | `signIn` 호출 → 성공 시 `/` 이동 |
| 폼 | 회원가입 버튼 | `signUp` 호출 → 성공 시 `/` 이동 |
| 에러 | 에러 메시지 | 실패 시 폼 하단 인라인 표시 |

**디자인:** 다크 모드 (bg-slate-900), 중앙 정렬 카드 레이아웃

---

### 11-2. 노트 도메인

---

#### [NOTE-01] 메인 앱 — 공통 헤더

**경로:** `/`  
**접근 조건:** 인증 사용자만. 미인증 시 `/login` 리다이렉트.

**데스크탑 (768px 이상):**

| 위치 | 구성 요소 | 동작 |
|------|-----------|------|
| 헤더 좌측 | 앱 로고 (시냅스) | — |
| 헤더 중앙 | 📝 노트 탭 버튼 | 클릭 → 노트 뷰 전환, 활성 시 파란 밑줄 |
| 헤더 중앙 | 🕸 그래프 탭 버튼 | 클릭 → 그래프 뷰 전환, 활성 시 파란 밑줄 |
| 헤더 우측 | 로그인된 이메일 주소 | 표시만 |
| 헤더 우측 | 로그아웃 버튼 | `signOut` 호출 → `/login` 이동 |

**모바일 (768px 미만):**

| 위치 | 구성 요소 | 동작 |
|------|-----------|------|
| 헤더 1행 좌측 | ☰ 햄버거 버튼 | 클릭 → 슬라이드 드로어 열기 |
| 헤더 1행 중앙 | 앱 로고 (시냅스) | — |
| 헤더 1행 우측 | 로그아웃 버튼 | `signOut` 호출 → `/login` 이동 |
| 헤더 2행 | 📝 노트 / 🕸 그래프 탭바 | 전체 너비, 탭 전환 |

---

#### [NOTE-02] 노트 탭 — 사이드바 (노트 목록)

**노출 조건:** 📝 노트 탭 활성 상태

**데스크탑:** 에디터 좌측 고정 사이드바 (너비 256px)  
**모바일:** ☰ 버튼으로 여는 슬라이드 드로어 (너비 256px, 에디터 위 오버레이)

| 구성 요소 | 설명 | 동작 |
|-----------|------|------|
| + 새 노트 버튼 | 상단 고정 | 클릭 → `/?noteId=new`, 드로어 닫힘(모바일) |
| 검색 입력창 | 실시간 필터 (제목 + 본문) | 입력 즉시 목록 갱신, × 버튼으로 초기화 |
| 태그 필터 칩 | 전체 태그 목록, 다중 선택 | 클릭 토글, 선택 태그는 남색 배경 |
| 태그 초기화 버튼 | 선택된 태그가 있을 때만 표시 | 클릭 → 태그 선택 전체 해제 |
| 노트 목록 | 검색 + 태그 AND 필터 결과 | 클릭 → 해당 노트 에디터로 이동, 드로어 닫힘(모바일) |
| 빈 상태 메시지 | 필터 결과 없음 / 노트 없음 구분 | 조건에 따라 다른 문구 표시 |

**필터 규칙:**
- 검색어 + 태그 필터 동시 AND 적용
- 태그 다중 선택 시 모든 태그를 가진 노트만 표시 (AND)
- 클라이언트 사이드 필터링 (추가 API 호출 없음)

---

#### [NOTE-03] 노트 탭 — 에디터

**노출 조건:** 📝 노트 탭 활성 상태, 노트 선택 또는 신규 작성 시

| 구성 요소 | 설명 | 동작 |
|-----------|------|------|
| 제목 입력 | 단일 텍스트 입력 | 엔터 → 본문 포커스 이동 |
| 본문 에디터 | TipTap 리치 에디터 | `[[` 입력 시 자동완성 드롭다운 |
| `[[링크]]` 자동완성 | 기존 노트 제목 드롭다운 | 키보드/클릭 선택 → 링크 삽입 |
| 저장 버튼 | 우측 상단 | `createNoteAction` / `updateNoteAction` 호출 |
| 삭제 버튼 | 우측 상단 | `deleteNoteAction` 호출 → `/` 이동 |
| 빈 상태 | 노트 미선택 시 | 안내 문구 표시 |

**저장 처리 순서:**
1. 노트 저장 (`notes` upsert)
2. `[[링크]]` 파싱 → `note_links` 동기화 (delete-then-insert)
3. 태그 upsert → `note_tags` 동기화

---

#### [NOTE-04] 노트 탭 — 링크 & 태그 패널

**위치:** 에디터 하단  
**노출 조건:** 저장된 노트 선택 시

| 패널 | 구성 요소 | 동작 |
|------|-----------|------|
| 아웃고잉 링크 | 현재 노트의 `[[링크]]` 대상 목록 | 클릭 → 해당 노트로 이동 |
| 백링크 | 현재 노트를 참조하는 노트 목록 | 클릭 → 해당 노트로 이동 |
| 태그 칩 | 현재 노트의 태그 목록 | 표시만 |

---

#### [NOTE-05] 그래프 탭

**노출 조건:** 🕸 그래프 탭 활성 상태

| 구성 요소 | 설명 | 동작 |
|-----------|------|------|
| 그래프 캔버스 | force-directed 노드-링크 그래프 | 드래그로 뷰 이동, 스크롤로 줌 |
| 노드 | 각 노트를 표현 | 호버 시 노트 제목 표시 |
| 엣지 | `note_links` 연결 관계 | — |
| 노드 클릭 | — | 📝 노트 탭 전환 + 해당 노트 에디터 열기 |

---

## 12. 개발 현황

| 단계 | 내용 | 상태 |
|------|------|------|
| 설계 | DB 스키마 + 아키텍처 원칙 | ✅ 완료 |
| 데이터 계층 | Supabase 마이그레이션 + lib/note/ TDD | ✅ 완료 |
| 인증 | 로그인 / 회원가입 / 라우트 보호 | ✅ 완료 |
| 노트 UI | 에디터, 링크, 그래프 뷰 | ✅ 완료 |
| 노트 검색 | 사이드바 실시간 검색 | ✅ 완료 |
| 태그 필터링 | 다중 선택 AND 필터 | ✅ 완료 |
| 모바일 반응형 | 슬라이드 드로어, 2행 헤더 | ✅ 완료 |
| AI 자동 태그 | LLM 기반 태그 추천 | 🔲 미구현 |
| 배포 | Vercel 프로덕션 배포 | 🔲 미구현 |

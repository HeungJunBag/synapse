# 🧠 시냅스 (Synapse)

> **생각과 생각을 연결하는 제텔카스텐 기반 개인 지식 관리 도구**

---

## 📌 프로젝트 개요 (Overview)

### 기획 배경

노트 앱을 쓰면서 늘 같은 문제를 겪었다.

> _"분명히 어딘가에 메모했는데... 어디 있더라?"_  
> _"이 아이디어가 저 아이디어와 관련 있는 것 같은데, 연결할 방법이 없다."_

Notion, Bear, Obsidian 같은 도구들은 정보를 **폴더와 계층 구조**로 저장한다. 지식은 선형이 아니라 그물망 구조로 발전하는데, 기존 도구들은 이 연결을 표현할 방법이 부족했다.

독일의 사회학자 니클라스 루만(Niklas Luhmann)은 이 문제를 **제텔카스텐(Zettelkasten)** 방법론으로 해결했다. 그는 70권의 책과 400편의 논문을 저술했는데, 비결은 엄청난 기억력이 아니라 _잘 연결된 메모 시스템_이었다.

시냅스는 이 방법론을 웹 앱으로 구현한 개인 지식 관리 도구다.

### 타겟 유저 & 페인 포인트

| 타겟 유저 | 페인 포인트 |
|-----------|-------------|
| 연구자 / 학생 | 논문과 강의 노트가 폴더에 흩어져 있고 서로 연결되지 않는다 |
| 개발자 | 기술 개념을 공부할수록 "이게 저거랑 연관이 있었나?" 싶은데 추적이 안 된다 |
| 지식 노동자 | 업무 중 떠오르는 인사이트가 메모에 묻혀 다시는 찾지 못한다 |

---

## ✨ 핵심 기능 및 데모 (Features & Demo)

### 주요 기능

| 기능 | 설명 |
|------|------|
| 📝 노트 CRUD | TipTap 리치 에디터로 노트 작성·편집·삭제 |
| 🔗 `[[링크]]` 자동완성 | `[[` 입력 시 기존 노트 드롭다운으로 노트 간 연결 |
| 🔄 링크 자동 동기화 | 저장 시 `[[링크]]` 파싱 → DB 자동 갱신 |
| ↗ 아웃고잉 링크 | 현재 노트에서 참조하는 노트 목록 |
| ↙ 백링크 | 현재 노트를 참조하는 노트 목록 |
| 🕸 그래프 뷰 | 노트 간 연결을 force-directed 그래프로 시각화 |
| 🔍 실시간 검색 | 제목·본문 전체를 실시간 클라이언트 필터링 |
| 🏷 태그 필터링 | 다중 선택 AND 조건 필터 (검색과 동시 적용) |
| 📱 모바일 반응형 | 슬라이드 드로어 방식, 768px 브레이크포인트 |

### 데모 화면

| 기능 | 미리보기 |
|------|----------|
| 그래프 뷰 | ![graph](https://github.com/user-attachments/assets/d74e0db6-9db5-4d7f-8bde-dfa822db203a) |
| `[[링크]]` 자동완성 | ![wikilink](https://github.com/user-attachments/assets/5c7b8346-47db-4c23-a1aa-4da4e4c3ff1e) |
| 태그 필터링 + 검색 | ![filter](https://github.com/user-attachments/assets/5b5cf604-3e50-4dee-93d6-fef766673abd) |
| 모바일 드로어 | ![mobile](https://github.com/user-attachments/assets/4b52b498-5be8-4e8c-8daf-e1e4831120af) |

---

## 🛠 기술 스택 및 선정 이유 (Tech Stack & Rationale)

### 사용 기술

| 분류 | 기술 | 버전 |
|------|------|------|
| **Frontend** | Next.js (App Router) | 16.2.6 |
| **UI Runtime** | React | 19.2.4 |
| **에디터** | TipTap | 3.23.x |
| **그래프** | react-force-graph-2d | 1.29.x |
| **Styling** | Tailwind CSS | 4.x |
| **Backend / DB** | Supabase (PostgreSQL + Auth + RLS) | 2.105.x |
| **언어** | TypeScript | 5.x |
| **테스트** | Vitest | 4.1.x |

### 각 기술을 선택한 이유

**Next.js 16 App Router**

| 대안 | 비교 |
|------|------|
| Next.js Pages Router | App Router는 Server Components + Server Actions로 별도 API 서버 없이 풀스택 구성 가능. 데이터 패칭이 서버에서 일어나므로 초기 로딩 시 노트 데이터가 HTML에 포함됨 |
| React + Express | 별도 백엔드 서버 구성 필요. Server Actions 덕분에 Form action 하나로 DB 조작 + 리다이렉트를 처리할 수 있어 코드량이 대폭 감소 |
| Remix | 생태계 크기와 Supabase SSR 공식 지원 측면에서 Next.js 선택 |

**Supabase**

| 대안 | 비교 |
|------|------|
| Firebase | PostgreSQL 기반이라 관계형 데이터 모델(노트-링크-태그 다대다) 표현에 적합. SQL 쿼리로 복잡한 조인 가능 |
| PlanetScale + Auth.js | Supabase는 DB + Auth + RLS를 한 서비스에서 제공. 별도 인증 서버 없이 Row Level Security로 사용자 데이터 격리 |
| Prisma + PostgreSQL | 로컬 Docker 개발 환경이 내장되어 있어 즉시 개발 시작 가능 |

**TipTap**

| 대안 | 비교 |
|------|------|
| Quill | ProseMirror 기반 Extension 시스템 덕분에 `[[링크]]` 자동완성 같은 커스텀 동작을 깔끔하게 캡슐화 가능 |
| contenteditable | TipTap은 HTML 직렬화·역직렬화를 자동 처리. `[[링크]]` 파싱을 위한 HTML 구조를 안정적으로 유지 |
| Slate.js | TipTap의 Suggestion API가 드롭다운 자동완성 구현에 최적화되어 있음 |

---

## 🏗 시스템 아키텍처 및 데이터 모델링 (Design)

### 시스템 구조도

```
┌──────────────────────────────────────────────────────┐
│                    사용자 브라우저                     │
│  React (Client Components)                            │
│  ├── TipTap 에디터 + WikiLink Extension              │
│  ├── react-force-graph-2d (그래프 시각화)            │
│  └── Tailwind CSS (반응형 UI)                        │
└───────────────────┬──────────────────────────────────┘
                    │ HTTP
┌───────────────────▼──────────────────────────────────┐
│                   Next.js (Vercel)                    │
│  ├── Server Components  → 초기 HTML에 데이터 포함    │
│  ├── Server Actions     → DB 직접 조작               │
│  └── proxy.ts           → 세션 검증 + 라우트 보호    │
└───────────────────┬──────────────────────────────────┘
                    │ Supabase Client (@supabase/ssr)
┌───────────────────▼──────────────────────────────────┐
│                   Supabase                            │
│  ├── PostgreSQL   → notes, note_links, tags, note_tags│
│  ├── Auth         → 이메일/패스워드 세션 (쿠키 기반) │
│  └── RLS          → 사용자별 데이터 완전 격리        │
└──────────────────────────────────────────────────────┘
```

### 데이터베이스 ERD

```
auth.users
    │
    ├──< notes (user_id FK)
    │       │  id, user_id, title, content, created_at, updated_at
    │       │
    │       ├──< note_links
    │       │       source_note_id FK ──┐
    │       │       target_note_id FK ──┘ (자기 참조)
    │       │
    │       └──< note_tags (note_id FK)
    │                │
    └──< tags ───────┘ (tag_id FK)
            id, user_id, name
```

**매핑 전략**

| 관계 | 전략 | 이유 |
|------|------|------|
| 노트 ↔ 링크 | 단방향 저장, 백링크는 역방향 쿼리 | 저장 단순화. `WHERE target_note_id = ?`로 백링크 조회 |
| 노트 ↔ 태그 | 다대다 (`note_tags` 조인 테이블) | 태그 마스터 재사용, `upsert`로 중복 방지 |
| 링크 동기화 | delete-then-insert (단일 트랜잭션) | 변경 추적보다 단순하고 원자적 |

---

## 🔌 API 명세 및 테스트 전략 (API & Test)

### Server Actions 명세

> 이 프로젝트는 REST API 대신 **Next.js Server Actions**를 사용한다.  
> 클라이언트에서 일반 함수처럼 호출되지만 실행은 서버에서 이루어진다.

**인증 Actions** — `src/app/(auth)/login/actions.ts`

| Action | 인자 | 반환 | 설명 |
|--------|------|------|------|
| `signIn` | `FormData` (email, password) | `{ error }` \| redirect | 성공 시 `/` 리다이렉트 |
| `signUp` | `FormData` (email, password) | `{ error }` \| redirect | 성공 시 `/` 리다이렉트 |
| `signOut` | — | redirect | `/login`으로 리다이렉트 |

**노트 Actions** — `src/app/(app)/actions/note-actions.ts`

| Action | 인자 | 반환 | 설명 |
|--------|------|------|------|
| `getNotesWithTagsAction` | — | `NoteWithTags[]` | 태그 포함 전체 노트 목록 |
| `getNoteAction` | `id` | `Note` | 단일 노트 조회 |
| `createNoteAction` | `title, content` | `Note` | 생성 + 링크 동기화 |
| `updateNoteAction` | `id, title, content` | `Note` | 수정 + 링크 동기화 |
| `deleteNoteAction` | `id` | `void` | 삭제 (cascade) |
| `getLinksAction` | `noteId` | `{ outgoing, backlinks }` | 링크 패널 데이터 |
| `getTagsAction` | `noteId` | `Tag[]` | 노트 태그 목록 |
| `getGraphDataAction` | — | `{ nodes, links }` | 그래프 뷰 데이터 |

### 테스트 전략

**단위 테스트 (Vitest)** — 순수 비즈니스 로직 검증

```
src/lib/note/
├── parse-links.ts      → [[링크]] 파싱 로직
│   └── __tests__/      → 4 tests  (정상 파싱, 중복 제거, 엣지 케이스)
├── notes.ts            → 노트 CRUD 로직
│   └── __tests__/      → 5 tests
├── links.ts            → 링크 동기화 로직
│   └── __tests__/      → 4 tests  (null safety 포함)
└── tags.ts             → 태그 upsert/조회 로직
    └── __tests__/      → 3 tests
```

**통합 테스트** — Server Actions E2E 검증 (`app/(app)/__tests__/`)

**커버리지 현황**

```
Test Files: 5 passed
Tests:      19 passed
Duration:   ~135ms
```

**테스트 설계 원칙**
- 순수 함수(`lib/note/`)는 단위 테스트로 완전 커버
- DB 의존 로직(Server Actions)은 실제 로컬 Supabase에 연결하여 통합 테스트
- 모킹 최소화: mock DB와 실제 DB의 동작 차이로 인한 버그 방지

---

## 🔍 기술적 의사결정 및 트러블슈팅 (Technical Decisions & Troubleshooting)

### 1. 검색·필터링 전략: 클라이언트 vs 서버

**문제 상황**  
실시간 검색과 태그 필터링을 구현할 때, 키 입력마다 Supabase에 쿼리를 보내는 방식(서버 사이드)과 전체 노트를 한 번만 받아서 클라이언트에서 필터링하는 방식(클라이언트 사이드) 중 선택해야 했다.

**대안 비교**

| 방식 | 장점 | 단점 |
|------|------|------|
| 서버 사이드 (ilike, ts_vector) | 대용량 데이터에 적합, DB 인덱스 활용 | 키 입력마다 네트워크 왕복, 지연 발생, debounce 필요 |
| 클라이언트 사이드 | 즉각적 반응 (0ms), 네트워크 없음, 코드 단순 | 노트 수가 매우 많으면 메모리 이슈 가능 |

**결정 및 근거**  
클라이언트 사이드 선택. 개인 지식 관리 도구의 특성상 노트가 수천 개를 넘기 어렵고, 실시간 반응이 UX에 훨씬 중요하다. `useMemo`로 렌더링 최적화까지 적용.

**결과**  
검색 반응 속도: **0ms** (키 입력 즉시 반영, 네트워크 왕복 없음)

---

### 2. 노트 링크 동기화: delete-then-insert 전략

**문제 상황**  
노트를 수정하면 `[[링크]]`가 추가되거나 삭제될 수 있다. `note_links` 테이블을 어떻게 갱신할 것인가?

**대안 비교**

| 전략 | 방식 | 문제 |
|------|------|------|
| 변경 추적 | 이전 링크 set과 새 링크 set을 비교해 diff 적용 | 구현 복잡, 엣지 케이스 많음 |
| delete-then-insert | 기존 링크 전체 삭제 → 새 링크 전체 삽입 | 단순하고 원자적 |

**결정 및 근거**  
delete-then-insert 선택. 단일 트랜잭션 안에서 처리되어 부분 실패가 없고, 코드가 30줄에서 10줄로 줄었다. 링크 수가 수백 개를 넘지 않는 개인 노트 특성상 성능 문제도 없다.

---

### 3. Next.js 16 Breaking Change — proxy.ts 마이그레이션

**문제 상황**  
Next.js 16 업그레이드 후 `middleware.ts`가 deprecated 되고 `proxy.ts`로 파일명과 함수명이 변경되었다. 기존 코드 그대로 실행하면 세션 갱신 로직이 동작하지 않는 무음 버그가 발생한다.

**원인 분석**  
Next.js 16은 라우트 보호 레이어를 미들웨어에서 프록시 레이어로 분리하는 방향으로 설계 변경. 기존 `middleware` 함수명이 더 이상 자동 감지되지 않음.

**해결**  
```bash
npx @next/codemod@canary middleware-to-proxy .
```
공식 codemod 실행으로 `middleware.ts` → `proxy.ts`, 함수명 `middleware` → `proxy` 일괄 변경. 세션 갱신 및 리다이렉트 로직 정상 동작 확인.

---

### 4. Supabase RLS — INSERT 시 user_id 누락 버그

**문제 상황**  
노트 생성(createNoteAction) 호출 시 `new row violates row-level security policy` 에러 발생. 코드상 RLS 정책은 올바르게 설정되어 있었다.

**원인 분석**  
RLS INSERT 정책: `user_id = auth.uid()`. 그런데 Server Action 코드에서 `user_id` 컬럼을 INSERT 구문에 명시하지 않아 `null`로 삽입 시도 → RLS 거부.

**해결**  
```typescript
// 수정 전
await supabase.from('notes').insert({ title, content })

// 수정 후
const { data: { user } } = await supabase.auth.getUser()
await supabase.from('notes').insert({ title, content, user_id: user.id })
```
`auth.uid()`는 DB 트리거에서는 자동으로 주입되지만, `insert()` 호출 시에는 명시적으로 포함해야 함을 확인.

---

### 5. NoteWithTags 타입 도입 — N+1 쿼리 제거

**문제 상황**  
태그 필터링 구현 시 사이드바에서 각 노트의 태그 정보가 필요했다. 기존 `Note` 타입에는 태그가 없어서 각 노트마다 태그를 개별 조회하는 N+1 쿼리 패턴이 발생할 위험이 있었다.

**해결**  
Supabase의 관계형 쿼리(`select('*, note_tags(tags(*))')`)를 활용해 단일 쿼리로 태그 포함 노트 목록을 조회.

```typescript
// NoteWithTags 타입 정의
interface NoteWithTags extends Note {
  tags: Tag[]
}

// 단일 쿼리로 태그 포함 조회
const { data } = await supabase
  .from('notes')
  .select('*, note_tags(tags(*))')
  .order('updated_at', { ascending: false })
```

**결과**  
노트 목록 조회 쿼리 수: **N+1 → 1** (노트 수와 무관하게 쿼리 1회)

---

## 🚀 시작 가이드 (Getting Started)

### 개발 환경 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20 이상 |
| Docker Desktop | 최신 버전 (Supabase 로컬 개발용) |
| Supabase CLI | 최신 버전 |

```bash
# Supabase CLI 설치
brew install supabase/tap/supabase
```

### 환경 변수 세팅

```bash
# frontend/.env.local 파일 생성
cp frontend/.env.example frontend/.env.local
```

`frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start 출력값 참고>
```

### 로컬 실행 순서

```bash
# 1. 저장소 클론
git clone https://github.com/HeungJunBag/synapse.git
cd synapse

# 2. 프론트엔드 의존성 설치
cd frontend && npm install && cd ..

# 3. Supabase 로컬 서버 시작 (Docker 필요)
supabase start
# → API URL과 anon key를 .env.local에 입력

# 4. 데모 시드 데이터 삽입 (선택)
supabase db query -f supabase/seed.sql

# 5. 개발 서버 시작
cd frontend && npm run dev
# → http://localhost:3000

# 6. 테스트 실행
npm test
```

**데모 계정** (시드 데이터 삽입 후 사용 가능)  
- Email: `test@example.com`  
- Password: `testpassword123` _(회원가입 후 사용)_

---

## 👤 개발자 소개 (Developer)

| GitHub | 역할 |
|--------|------|
| [@HeungJunBag](https://github.com/HeungJunBag) | 기획 · 설계 · 전체 개발 |

**기여 범위**
- 제텔카스텐 방법론 기반 서비스 기획 및 도메인 설계
- Supabase 스키마 설계 (notes, note_links, tags, note_tags + RLS)
- Next.js 16 App Router + Server Actions 풀스택 구현
- TipTap 기반 `[[WikiLink]]` 자동완성 커스텀 Extension 개발
- react-force-graph-2d 그래프 뷰 연동
- 실시간 검색 · 태그 필터링 (클라이언트 사이드)
- 모바일 반응형 (슬라이드 드로어)
- Vitest 기반 단위·통합 테스트 19개 작성

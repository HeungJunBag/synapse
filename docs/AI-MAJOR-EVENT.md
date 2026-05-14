# 주요 사건 및 의사결정

---

## [2026-05-13] 노트 UI 전체 구현 완료

**배경:** 노트 도메인 DB 스키마 및 데이터 접근 계층 완성 후, 사용자가 실제로 노트를 작성하고 연결을 탐색할 수 있는 프론트엔드 UI 구현.

**핵심 결정:**
- 레이아웃: 탭 전환 (노트 탭 + 그래프 탭) — 심플함 유지
- 에디터: TipTap + `[[링크]]` 커스텀 확장 (Suggestion + tippy.js)
- 그래프: react-force-graph-2d (SSR 불가 → dynamic import 필수)
- 노트 선택: URL `?noteId=xxx` searchParams 기반 (새로고침 후 상태 유지)
- Server Actions: `lib/note/*.ts`는 브라우저 클라이언트 사용 → Server Actions에서 재사용 불가 → 별도 `note-actions.ts`에서 서버 클라이언트 직접 사용

**발견된 버그 및 수정:**
- `createNoteAction` INSERT에 `user_id` 누락 → RLS 정책(`auth.uid() = user_id`) 위반 → `auth.getUser()`로 user_id 획득 후 포함

**E2E 검증 완료 시나리오:**
- 새 노트 생성/편집/삭제
- `[[링크]]` 자동완성 드롭다운
- 아웃고잉 링크 + 백링크 패널
- 그래프 탭 노드 표시 + 클릭 네비게이션

---

## [2026-05-13] 인증(Auth) 구현 완료

**배경:** Supabase Auth 기반 이메일/패스워드 로그인 구현.

**핵심 결정:**
- `@supabase/ssr` 패키지로 쿠키 기반 세션 관리
- middleware에서 세션 갱신 + 라우트 보호 (미인증 → /login, 인증 상태에서 /login → /)
- Server Actions으로 signIn / signUp / signOut 처리
- Supabase config.toml: `enable_confirmations = false` — 이메일 확인 없이 즉시 세션 생성

**E2E 검증 완료 시나리오:**
- 비로그인 상태 / 접근 차단
- 회원가입 → 자동 로그인
- 로그인 / 로그아웃
- 로그인 상태에서 /login 접근 → / 리다이렉트
- 잘못된 비밀번호 에러 표시

---

## [2026-05-13] Next.js 16 proxy 컨벤션 변경 확인

**결정:** `middleware.ts` deprecated 경고 확인. 기능 동작에는 영향 없으므로 코드 변경 없이 TODO-BACKLOG에 기록.

**참조:** `docs/ARCHITECTURE-STATUTE.md`, `docs/TODO-BACKLOG.md`

---

## [2026-05-13] 노트 도메인 스키마 & 데이터 접근 계층 구현

**핵심 결정:**
- 링크 방향: 단방향 (`note_links` 테이블), 백링크는 역방향 쿼리로 조회
- 태그: 별도 `tags` + `note_tags` 테이블 (다대다)
- 링크 파싱: Next.js에서 `parseLinkTitles()` 순수 함수로 처리
- 링크 동기화: delete-then-insert 패턴 (syncNoteLinks)

---

## [2026-05-12] 프로젝트 아키텍처 원칙 확정

**결정:**
- Frontend: Next.js App Router (Pages Router 사용 안 함)
- Backend: Supabase만 사용 (별도 API 서버 없음)
- UI: ShadCN UI 우선, Tailwind CSS

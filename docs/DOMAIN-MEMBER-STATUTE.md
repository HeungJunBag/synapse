# 회원 도메인 규칙 (DOMAIN-MEMBER-STATUTE)

## 1. 인증 방식

- 이메일/패스워드 로그인만 지원한다 (소셜 로그인 미구현).
- Supabase config.toml: `enable_confirmations = false` — 이메일 확인 없이 즉시 세션 생성.

## 2. 세션 관리

- `@supabase/ssr` 패키지를 사용한다.
- 서버 클라이언트: `frontend/src/lib/supabase/server.ts` — `cookies()`로 세션 읽기/갱신.
- 브라우저 클라이언트: `frontend/src/lib/supabase/client.ts` — 클라이언트 컴포넌트에서 사용.

## 3. 라우트 구조

| 경로 | 설명 | 접근 |
|------|------|------|
| `/login` | 로그인/회원가입 페이지 | 미인증 사용자만 |
| `/` (및 하위) | 메인 앱 | 인증 사용자만 |

## 4. 라우트 보호 규칙

- `frontend/src/middleware.ts`에서 모든 요청에 대해 세션 검증.
- 미인증 + `/` 접근 → `/login` 리다이렉트.
- 인증 + `/login` 접근 → `/` 리다이렉트.
- `(app)` 그룹 layout에서 추가로 `supabase.auth.getUser()` 검증.

## 5. Server Actions

- `frontend/src/app/(auth)/login/actions.ts`에 `signIn`, `signUp`, `signOut` 정의.
- 모두 `'use server'` 지시어 포함.
- 성공 시 `redirect()` 호출 — 클라이언트에 에러 반환하지 않음.
- 실패 시 `{ error: string }` 반환.

## 6. RLS 정책

- 모든 사용자 데이터 테이블에 RLS 활성화 필수.
- `user_id uuid references auth.users(id)` 컬럼으로 소유권 확인.
- INSERT 시 반드시 `user_id`를 명시적으로 포함해야 함 (`auth.uid()`로 획득).

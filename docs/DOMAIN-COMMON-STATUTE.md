# 공통 도메인 규칙 (DOMAIN-COMMON-STATUTE)

## 1. Supabase 클라이언트 사용 규칙

| 사용 위치 | 사용할 클라이언트 | 파일 |
|-----------|------------------|------|
| Server Component, Server Action | 서버 클라이언트 | `@/lib/supabase/server` |
| Client Component (브라우저) | 브라우저 클라이언트 | `@/lib/supabase/client` |

- `lib/note/*.ts` 등 기존 데이터 접근 함수는 브라우저 클라이언트를 사용하므로 Server Actions에서 직접 재사용하지 않는다.

## 2. RLS 필수 사항

- 모든 테이블에 `enable row level security` 적용.
- INSERT 시 `user_id`를 명시적으로 포함해야 RLS `with check` 통과.
- `user_id`는 `supabase.auth.getUser()`로 획득한다.

## 3. 타입 정의 위치

- `frontend/src/types/` 디렉토리에 도메인별 타입 정의.
- 현재: `frontend/src/types/note.ts` (Note, Tag, NoteLink, NoteTag 등)

## 4. 에러 처리

- Supabase 쿼리 후 `if (error) throw error` 패턴 사용.
- Server Component에서 throw하면 Next.js error boundary가 처리.
- Client Component에서 Server Action 호출 시 try/catch로 UI 에러 표시.

## 5. Next.js 16 특이사항

- `searchParams`는 `Promise<{...}>` 타입 → Server Component에서 반드시 `await searchParams` 사용.
- `middleware.ts` deprecated → `proxy.ts` 마이그레이션 예정 (TODO-BACKLOG 참조).

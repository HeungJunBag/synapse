# TODO-BACKLOG

아직 시작하지 않은 예정 작업 목록.

---

## [BACKLOG] middleware.ts → proxy.ts 마이그레이션

**배경:**
Next.js 16에서 `middleware` 파일 컨벤션이 `proxy`로 변경됨 (deprecated 경고 발생).
관련 규칙: `docs/ARCHITECTURE-STATUTE.md` — "Next.js 16+ proxy 컨벤션 준수"

**작업 내용:**
1. `frontend/src/middleware.ts` → `frontend/src/proxy.ts` 파일명 변경
2. 함수명 `export async function middleware` → `export async function proxy` 변경
3. 또는 공식 codemod 사용:
   ```bash
   cd frontend
   npx @next/codemod@canary middleware-to-proxy .
   ```
4. TypeScript 컴파일 확인: `npx tsc --noEmit`
5. dev server에서 인증 플로우 재검증 (로그인 → 리다이렉트 → 로그아웃)
6. 커밋: `chore: migrate middleware.ts to proxy.ts (Next.js 16 convention)`

**우선순위:** 낮음 (기능 동작에는 영향 없음, deprecation 경고만 발생)

---

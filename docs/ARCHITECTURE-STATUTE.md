# 아키텍처 구현 규칙

---

## Next.js

### Next.js 16+ proxy 컨벤션 준수

- Next.js 16부터 `middleware.ts`는 deprecated, `proxy.ts`로 파일명 변경
- 함수명도 `middleware` → `proxy`로 변경
- 공식 마이그레이션 codemod: `npx @next/codemod@canary middleware-to-proxy .`
- 현재 프로젝트는 `proxy.ts` 사용 중 (마이그레이션 완료 2026-05-14)
- 기능(세션 갱신, 리다이렉트 로직)은 동일, 이름만 변경됨

---

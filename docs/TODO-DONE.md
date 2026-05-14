# 완료된 작업

---

## [2026-05-14] middleware.ts → proxy.ts 마이그레이션

- `frontend/src/middleware.ts` 삭제
- `frontend/src/proxy.ts` 생성 (함수명 `proxy`로 변경)
- deprecation 경고 제거 확인

---

## [2026-05-13] 노트 UI 구현

- TipTap 리치 에디터 + `[[링크]]` 자동완성
- 아웃고잉 링크 + 백링크 패널
- react-force-graph-2d 그래프 뷰
- Server Actions (note-actions.ts) + 테스트
- E2E 검증 완료

---

## [2026-05-13] 인증(Auth) 구현

- Supabase Auth 이메일/패스워드 로그인
- middleware 라우트 보호
- signIn / signUp / signOut Server Actions
- E2E 5개 시나리오 검증 완료

---

## [2026-05-13] 노트 도메인 스키마 & 데이터 접근 계층

- Supabase 마이그레이션 (notes, note_links, tags, note_tags + RLS)
- TypeScript 타입 정의
- lib/note/ TDD (parse-links, notes, links, tags) — 16 tests

---

## [2026-05-12] 프로젝트 초기 문서 정비

- CLAUDE.md 작성
- ARCHITECTURE-CONSTITUTION.md 작성
- 도메인 문서 파일 생성

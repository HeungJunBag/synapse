# Auth 설계

**날짜**: 2026-05-13  
**상태**: 승인됨  
**관련 문서**: `docs/ARCHITECTURE-CONSTITUTION.md`, `docs/DOMAIN-NOTE-STATUTE.md`

---

## 1. 배경 및 목표

시냅스 앱의 모든 노트 데이터는 `user_id` 기반 RLS로 보호되어 있다. Auth 세팅의 목적은 Supabase Auth와 Next.js App Router를 연결하여 인증된 사용자만 앱에 접근할 수 있도록 하는 것이다.

**로그인 방식**: 이메일 + 비밀번호  
**세션 보호**: `middleware.ts` 기반 (모든 요청 가로채기)

---

## 2. 핵심 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| Auth 라이브러리 | `@supabase/ssr` | Next.js App Router 공식 지원, 쿠키 기반 세션 자동 처리 |
| 로그인 방식 | 이메일 + 비밀번호 | 단순, 로컬 개발에 적합 |
| 세션 보호 | `middleware.ts` | 모든 요청 단일 진입점, 토큰 자동 갱신 |
| 이메일 확인 | 로컬 환경 비활성화 | `config.toml`에서 `enable_confirmations = false` |

---

## 3. 파일 구조

```
frontend/src/
  middleware.ts                     # 세션 갱신 + 미인증 리다이렉트
  lib/supabase/
    client.ts                       # 기존 — 브라우저 클라이언트
    server.ts                       # 신규 — 서버 클라이언트 (Server Components, Actions)
  app/
    (auth)/                         # 인증 불필요 라우트 그룹
      login/
        page.tsx                    # 로그인/회원가입 UI
        actions.ts                  # Server Action: signIn, signUp, signOut
    (app)/                          # 인증 필요 라우트 그룹
      layout.tsx                    # 세션 확인, 미인증 시 /login 리다이렉트
      page.tsx                      # 메인 페이지 (보호됨, placeholder)
```

---

## 4. 데이터 흐름

### 로그인
```
폼 제출 → signIn() Server Action
  → supabase.auth.signInWithPassword({ email, password })
  → 성공: 쿠키에 세션 저장 → / 리다이렉트
  → 실패: 에러 메시지 반환
```

### 회원가입
```
폼 제출 → signUp() Server Action
  → supabase.auth.signUp({ email, password })
  → 성공: 자동 로그인 (이메일 확인 비활성화) → / 리다이렉트
  → 실패: 에러 메시지 반환
```

### 로그아웃
```
버튼 클릭 → signOut() Server Action
  → supabase.auth.signOut()
  → 쿠키 삭제 → /login 리다이렉트
```

### 세션 갱신 (모든 요청)
```
요청 → middleware.ts
  → createServerClient() + getUser()
  → 만료 토큰 자동 갱신 후 쿠키 업데이트
  → 미인증 + 보호 경로 → /login 리다이렉트
  → 인증됨 + /login → / 리다이렉트
  → 나머지 → 통과
```

---

## 5. 보호 경로 정의

| 경로 | 보호 여부 | 설명 |
|------|----------|------|
| `/login` | 공개 | 미인증 사용자 진입점 |
| `/` | 보호 | 메인 노트 페이지 |
| `/api/*` | 보호 | API 라우트 (추후) |

---

## 6. Supabase 로컬 설정

`supabase/config.toml`에서 이메일 확인 비활성화:
```toml
[auth.email]
enable_confirmations = false
```

---

## 7. 범위 외

- OAuth (Google 등) 소셜 로그인 — 추후 필요 시 추가
- 비밀번호 재설정 플로우 — 추후 구현
- 이메일 확인 플로우 — 로컬 환경에서 비활성화, 프로덕션 시 활성화

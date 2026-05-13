## 1. 개요

시냅스(Synapse)의 기술 아키텍처 핵심 원칙을 정의한다.

---

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js (App Router) |
| Backend | Supabase |
| Styling | Tailwind CSS, ShadCN UI |

---

## 3. 아키텍처 원칙

- **Frontend는 App Router 기반**으로 작성한다. Pages Router를 사용하지 않는다.
- **백엔드 로직은 Supabase**에 위임한다. 별도 API 서버를 임의로 추가하지 않는다.
- **UI 컴포넌트는 ShadCN UI**를 우선 사용하고, 커스텀 컴포넌트는 꼭 필요한 경우에만 만든다.
- **스타일은 Tailwind CSS**로 작성한다. 인라인 style 속성 사용을 지양한다.

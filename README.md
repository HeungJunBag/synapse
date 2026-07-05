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

## 🛠 기술 스택 (Tech Stack)

| 분류 | 기술 | 버전 |
|------|------|------|
| **Frontend** | Next.js (App Router) | 16.x |
| **UI Runtime** | React | 19.x |
| **에디터** | TipTap | 3.x |
| **그래프** | react-force-graph-2d | 1.x |
| **Styling** | Tailwind CSS | 4.x |
| **Backend** | Spring Boot 3 | 3.x |
| **보안** | Spring Security + JWT (jjwt) | — |
| **ORM** | Spring Data JPA (Hibernate) | — |
| **Database** | PostgreSQL (Supabase 로컬) | — |
| **언어** | TypeScript / Java 17 | — |

---

## 🏗 시스템 아키텍처 (Architecture)

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
│              Next.js (Frontend Server)                │
│  ├── Server Components  → 초기 HTML에 데이터 포함    │
│  ├── Server Actions     → apiClient로 백엔드 호출    │
│  └── proxy.ts           → JWT 쿠키로 라우트 보호     │
└───────────────────┬──────────────────────────────────┘
                    │ REST API (Authorization: Bearer JWT)
┌───────────────────▼──────────────────────────────────┐
│            Spring Boot (Backend Server)               │
│  ├── AuthController   → POST /api/auth/login, signup │
│  ├── NoteController   → GET/POST/PUT/DELETE /api/notes│
│  ├── TagController    → GET /api/tags                │
│  ├── Spring Security  → JWT 인증 필터                │
│  └── JPA              → PostgreSQL ORM               │
└───────────────────┬──────────────────────────────────┘
                    │ JDBC
┌───────────────────▼──────────────────────────────────┐
│              PostgreSQL (Supabase 로컬)               │
│  members, notes, note_links, tags, note_tags          │
└──────────────────────────────────────────────────────┘
```

### 데이터베이스 ERD

```
members
    │ id, email, password, created_at
    │
    ├──< notes (user_id FK)
    │       │ id, user_id, title, content, created_at, updated_at
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

---

## 🚀 로컬 실행 가이드 (Getting Started)

### 사전 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20 이상 |
| Java | 17 이상 |
| Docker Desktop | 최신 버전 |
| Supabase CLI | 최신 버전 |

```bash
# Supabase CLI 설치
brew install supabase/tap/supabase
```

---

### 1단계 — 저장소 클론 및 브랜치 이동

```bash
git clone https://github.com/HeungJunBag/synapse.git
cd synapse
git checkout synapse-v2
```

---

### 2단계 — Supabase 로컬 DB 시작

```bash
supabase start
```

실행 후 출력되는 값을 메모해 둡니다.

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
```

---

### 3단계 — DB 마이그레이션 및 시드 데이터 적용

```bash
supabase db reset
```

> `db reset`은 마이그레이션 적용 → 시드 데이터 삽입을 한 번에 처리합니다.  
> `supabase db query -f seed.sql`을 단독으로 실행하지 마세요 (마이그레이션 미적용 상태에서 FK 오류 발생).

---

### 4단계 — Spring Boot 백엔드 환경변수 설정

`backend/src/main/resources/application.yml`의 환경변수를 설정합니다.

```bash
# 터미널 환경변수로 주입하거나 IDE Run Configuration에서 설정
export DB_URL=jdbc:postgresql://localhost:54322/postgres
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=local-dev-secret-key-32-chars-min!!
export FRONTEND_URL=http://localhost:3000
```

---

### 5단계 — Spring Boot 백엔드 실행

```bash
cd backend
./gradlew bootRun
# → http://localhost:8080
```

---

### 6단계 — Next.js 프론트엔드 환경변수 설정

```bash
cp frontend/.env.example frontend/.env.local
```

`frontend/.env.local`:

```env
API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<2단계에서 확인한 anon key>
```

---

### 7단계 — Next.js 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

### 데모 계정

`supabase db reset` 실행 후 아래 계정으로 바로 로그인 가능합니다.

| 항목 | 값 |
|------|-----|
| 이메일 | `demo@synapse.com` |
| 비밀번호 | `synapse1234` |

---

## 👤 개발자 소개 (Developer)

| GitHub | 역할 |
|--------|------|
| [@HeungJunBag](https://github.com/HeungJunBag) | 기획 · 설계 · 전체 개발 |

**기여 범위**
- 제텔카스텐 방법론 기반 서비스 기획 및 도메인 설계
- Spring Boot 3 + Spring Security + JWT 인증 백엔드 구현
- PostgreSQL 스키마 설계 (notes, note_links, tags, note_tags, members)
- Next.js 16 App Router + Server Actions 프론트엔드 구현
- TipTap 기반 `[[WikiLink]]` 자동완성 커스텀 Extension 개발
- react-force-graph-2d 그래프 뷰 연동
- 실시간 검색 · 태그 필터링 (클라이언트 사이드)
- 모바일 반응형 (슬라이드 드로어)

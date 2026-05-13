# 노트 도메인 Supabase 스키마 설계

**날짜**: 2026-05-12  
**상태**: 승인됨  
**관련 문서**: `docs/DOMAIN-NOTE-CONSTITUTION.md`, `docs/DOMAIN-NOTE-STATUTE.md`

---

## 1. 배경 및 목표

시냅스(Synapse)는 제텔카스텐 방법론 기반 지식 연결 도구다. 노트 도메인의 Supabase 테이블 스키마를 설계하여 다음 세 가지 핵심 원칙을 DB 레벨에서 지원한다.

- **원자성**: 하나의 메모는 하나의 생각만 담는다.
- **연결성**: 메모 간 `[[링크]]` 관계를 추적하고 백링크를 제공한다.
- **자동화**: 에이전트가 생성한 태그를 저장하고 재사용한다.

---

## 2. 핵심 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 링크 방향성 | 단방향 (A→B만 저장) | 백링크는 쿼리로 조회, 저장 중복 방지 |
| 태그 저장 방식 | 별도 `tags` + `note_tags` 테이블 | 태그 재사용, 통계, 에이전트 upsert 지원 |
| 링크 파싱 주체 | 클라이언트(Next.js) | 초기 단순 구현, 추후 서버 사이드로 이전 가능 |
| 링크 관리 방식 | 별도 `note_links` 테이블 (접근법 A) | FK 무결성, 인덱스 성능, 백링크 단순 쿼리 |

---

## 3. 테이블 스키마

### `notes`
```sql
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### `note_links`
```sql
create table note_links (
  id             uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references notes(id) on delete cascade,
  target_note_id uuid not null references notes(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (source_note_id, target_note_id)
);
create index on note_links(source_note_id);
create index on note_links(target_note_id);
```

### `tags`
```sql
create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
```

### `note_tags`
```sql
create table note_tags (
  note_id    uuid not null references notes(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);
create index on note_tags(tag_id);
```

---

## 4. 링크 동기화 플로우

```
메모 저장(create/update)
    ↓
클라이언트: 본문에서 [[제목]] 파싱
    ↓
notes 테이블에서 제목 → id 조회
    ↓
note_links에서 source_note_id 기존 레코드 전체 삭제
    ↓
새 링크 일괄 insert
```

---

## 5. 범위 외 (현재 설계에서 제외)

- 링크 타입 분류 (참조/관련/반박 등) — 과설계, YAGNI
- DB Trigger 기반 자동 파싱 — 초기 단순 구현 이후 고려
- 양방향 링크 레코드 명시 저장 — 불필요, 쿼리로 해결

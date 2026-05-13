## 1. 데이터 구조 규칙

### 1-1. 테이블 구성

노트 도메인은 다음 4개의 테이블로 구성한다.

| 테이블 | 역할 |
|--------|------|
| `notes` | 원자적 메모 저장 |
| `note_links` | 메모 간 단방향 링크 관계 |
| `tags` | 태그 마스터 목록 |
| `note_tags` | 메모-태그 다대다 조인 |

---

### 1-2. DDL

```sql
-- 메모 (원자성 원칙: 하나의 행 = 하나의 생각)
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null default '',   -- Markdown, [[링크]] 포함
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 메모 간 연결 (연결성 원칙: [[링크]] 관계 저장)
create table note_links (
  id             uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references notes(id) on delete cascade,
  target_note_id uuid not null references notes(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (source_note_id, target_note_id)
);

create index on note_links(source_note_id);
create index on note_links(target_note_id);

-- 태그 마스터 (자동화 원칙: 에이전트가 upsert)
create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- 메모-태그 조인
create table note_tags (
  note_id    uuid not null references notes(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create index on note_tags(tag_id);
```

---

### 1-3. 링크 동기화 규칙

- `[[링크]]` 파싱 주체는 **클라이언트(Next.js)**다.
- 메모 저장(create/update) 시 다음 순서로 처리한다.
  1. 본문에서 `[[노트 제목]]` 패턴 추출
  2. 제목으로 `notes.id` 조회
  3. `note_links`에서 해당 `source_note_id`의 기존 링크 전체 삭제
  4. 새로 파싱된 링크 일괄 insert
- 링크 방향은 **단방향(source → target)**만 저장한다.
- 백링크는 `WHERE target_note_id = ?` 쿼리로 조회한다.

---

### 1-4. 태그 동기화 규칙

- 에이전트가 태그를 자동 생성할 때 `tags` 테이블에 `upsert`한다.
- 사용자가 수동으로 태그를 추가하는 경우도 동일하게 `upsert`한다.
- 태그 이름은 동일 `user_id` 내에서 유일하다.
- 노트 삭제 시 `note_tags`는 cascade로 자동 삭제된다. `tags` 마스터는 삭제되지 않는다.

---

### 1-5. 핵심 쿼리 패턴

| 목적 | 쿼리 |
|------|------|
| 아웃고잉 링크 조회 | `SELECT * FROM note_links WHERE source_note_id = ?` |
| 백링크(인커밍 링크) 조회 | `SELECT * FROM note_links WHERE target_note_id = ?` |
| 노트의 태그 목록 | `SELECT t.* FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ?` |
| 태그로 메모 검색 | `SELECT n.* FROM notes n JOIN note_tags nt ON n.id = nt.note_id WHERE nt.tag_id = ?` |

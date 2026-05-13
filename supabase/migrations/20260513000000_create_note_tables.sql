-- notes: 원자적 메모
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- note_links: 단방향 [[링크]] 관계
create table note_links (
  id             uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references notes(id) on delete cascade,
  target_note_id uuid not null references notes(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (source_note_id, target_note_id)
);

create index note_links_source_idx on note_links(source_note_id);
create index note_links_target_idx on note_links(target_note_id);

-- tags: 태그 마스터
create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- note_tags: 메모-태그 다대다 조인
create table note_tags (
  note_id    uuid not null references notes(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create index note_tags_tag_idx on note_tags(tag_id);

-- RLS 활성화
alter table notes     enable row level security;
alter table note_links enable row level security;
alter table tags      enable row level security;
alter table note_tags  enable row level security;

-- notes RLS 정책
create policy "notes: 본인만 조회"  on notes for select using (auth.uid() = user_id);
create policy "notes: 본인만 삽입"  on notes for insert with check (auth.uid() = user_id);
create policy "notes: 본인만 수정"  on notes for update using (auth.uid() = user_id);
create policy "notes: 본인만 삭제"  on notes for delete using (auth.uid() = user_id);

-- note_links RLS 정책 (source 노트 소유자 기준)
create policy "note_links: 본인 노트 링크만 조회"
  on note_links for select
  using (exists (select 1 from notes where notes.id = note_links.source_note_id and notes.user_id = auth.uid()));

create policy "note_links: 본인 노트 링크만 삽입"
  on note_links for insert
  with check (
    exists (select 1 from notes where notes.id = note_links.source_note_id and notes.user_id = auth.uid())
    and
    exists (select 1 from notes where notes.id = note_links.target_note_id and notes.user_id = auth.uid())
  );

create policy "note_links: 본인 노트 링크만 삭제"
  on note_links for delete
  using (exists (select 1 from notes where notes.id = note_links.source_note_id and notes.user_id = auth.uid()));

-- tags RLS 정책
create policy "tags: 본인만 조회" on tags for select using (auth.uid() = user_id);
create policy "tags: 본인만 삽입" on tags for insert with check (auth.uid() = user_id);
create policy "tags: 본인만 수정" on tags for update using (auth.uid() = user_id);
create policy "tags: 본인만 삭제" on tags for delete using (auth.uid() = user_id);

-- note_tags RLS 정책 (노트 소유자 기준)
create policy "note_tags: 본인 노트만 조회"
  on note_tags for select
  using (exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));

create policy "note_tags: 본인 노트만 삽입"
  on note_tags for insert
  with check (exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));

create policy "note_tags: 본인 노트만 삭제"
  on note_tags for delete
  using (exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));

-- updated_at 자동 갱신 트리거
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function set_updated_at();

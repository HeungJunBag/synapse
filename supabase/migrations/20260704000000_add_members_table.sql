-- Spring Boot 백엔드용 members 테이블 추가
-- notes.user_id FK를 auth.users → members로 변경

create table if not exists members (
    id         uuid primary key default gen_random_uuid(),
    email      text not null unique,
    password   text not null,
    created_at timestamptz not null default now()
);

-- notes FK 교체 (auth.users → members)
alter table notes drop constraint if exists notes_user_id_fkey;
alter table notes
    add constraint notes_user_id_fkey
    foreign key (user_id) references members(id) on delete cascade;

-- tags FK 교체
alter table tags drop constraint if exists tags_user_id_fkey;
alter table tags
    add constraint tags_user_id_fkey
    foreign key (user_id) references members(id) on delete cascade;

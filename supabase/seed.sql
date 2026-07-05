-- ============================================================
-- 로컬 개발 환경 데모 데이터
-- 계정: demo@synapse.com / synapse1234
-- ============================================================

create extension if not exists pgcrypto;

-- 데모 계정 (고정 UUID로 반복 실행 안전)
insert into members (id, email, password) values (
  '00000000-0000-0000-0000-000000000001',
  'demo@synapse.com',
  crypt('synapse1234', gen_salt('bf', 10))
) on conflict (id) do nothing;

-- ============================================================
-- 데모 노트 / 태그 / 링크
-- ============================================================
do $$
declare
  mid  uuid := '00000000-0000-0000-0000-000000000001';
  n1   uuid := '10000000-0000-0000-0000-000000000001';
  n2   uuid := '10000000-0000-0000-0000-000000000002';
  n3   uuid := '10000000-0000-0000-0000-000000000003';
  n4   uuid := '10000000-0000-0000-0000-000000000004';
  n5   uuid := '10000000-0000-0000-0000-000000000005';
  n6   uuid := '10000000-0000-0000-0000-000000000006';
  n7   uuid := '10000000-0000-0000-0000-000000000007';
  t1   uuid := '20000000-0000-0000-0000-000000000001';
  t2   uuid := '20000000-0000-0000-0000-000000000002';
  t3   uuid := '20000000-0000-0000-0000-000000000003';
  t4   uuid := '20000000-0000-0000-0000-000000000004';
begin

  -- 노트
  insert into notes (id, user_id, title, content) values
    (n1, mid, 'Zettelkasten이란',
     '[[메모 연결]]의 핵심은 아이디어 간의 링크다. [[지식 관리]] 시스템의 기초가 되는 방법론.'),
    (n2, mid, '메모 연결',
     '[[Zettelkasten이란]]에서 설명하듯, 단순 저장이 아닌 아이디어 간 연결이 [[지식 관리]]의 핵심이다.'),
    (n3, mid, '지식 관리',
     '좋은 [[지식 관리]] 시스템은 [[메모 연결]]을 통해 아이디어를 발전시킨다. [[Second Brain]] 참고.'),
    (n4, mid, 'Second Brain',
     '디지털 [[지식 관리]] 방법론. [[Zettelkasten이란]]을 현대적으로 재해석한 개념.'),
    (n5, mid, '글쓰기와 생각',
     '[[메모 연결]]을 활용한 글쓰기. 생각을 명료화하는 가장 좋은 방법은 쓰는 것이다.'),
    (n6, mid, '아이디어 발전',
     '[[Zettelkasten이란]]의 핵심 가치. [[메모 연결]]로 새로운 통찰을 만들어낸다.'),
    (n7, mid, '노트 작성 원칙',
     '원자적 노트: 하나의 노트에 하나의 아이디어. [[Zettelkasten이란]] 방법론의 기본 규칙.')
  on conflict (id) do nothing;

  -- 태그
  insert into tags (id, user_id, name) values
    (t1, mid, '방법론'),
    (t2, mid, '생산성'),
    (t3, mid, '글쓰기'),
    (t4, mid, '지식')
  on conflict (id) do nothing;

  -- 노트-태그 연결
  insert into note_tags (note_id, tag_id) values
    (n1, t1), (n1, t4),
    (n2, t4),
    (n3, t1), (n3, t2), (n3, t4),
    (n4, t1), (n4, t2),
    (n5, t3),
    (n6, t4),
    (n7, t1), (n7, t3)
  on conflict do nothing;

  -- 노트 링크 (위키링크 기반)
  insert into note_links (id, source_note_id, target_note_id) values
    (gen_random_uuid(), n1, n2),
    (gen_random_uuid(), n1, n3),
    (gen_random_uuid(), n2, n1),
    (gen_random_uuid(), n2, n3),
    (gen_random_uuid(), n3, n2),
    (gen_random_uuid(), n3, n4),
    (gen_random_uuid(), n4, n1),
    (gen_random_uuid(), n4, n3),
    (gen_random_uuid(), n5, n2),
    (gen_random_uuid(), n6, n1),
    (gen_random_uuid(), n6, n2),
    (gen_random_uuid(), n7, n1)
  on conflict do nothing;

end $$;

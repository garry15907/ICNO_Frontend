-- 배경화면 마켓 스키마 (market_icons 미러링, 단일 이미지 전용)
-- 이 앱이 붙어 있는 Supabase 프로젝트의 SQL 에디터에서 한 번 실행하세요.

create table if not exists public.market_wallpapers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 1000),
  tags text[] not null default '{}',
  image_path text not null,
  sha256 text,
  width int,
  height int,
  format text,
  downloads int not null default 0,
  likes int not null default 0,
  views int not null default 0,
  wishlist_count int not null default 0,
  comment_count int not null default 0,
  rating_sum int not null default 0,
  rating_count int not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.market_wallpapers to authenticated;
grant select on public.market_wallpapers to anon;
grant all on public.market_wallpapers to service_role;

alter table public.market_wallpapers enable row level security;

create policy "public wallpapers are readable"
  on public.market_wallpapers for select
  using (is_public or auth.uid() = owner_id);

create policy "owners insert their wallpapers"
  on public.market_wallpapers for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "owners update their wallpapers"
  on public.market_wallpapers for update to authenticated
  using (auth.uid() = owner_id);

create policy "owners delete their wallpapers"
  on public.market_wallpapers for delete to authenticated
  using (auth.uid() = owner_id);

create index if not exists market_wallpapers_public_created_idx
  on public.market_wallpapers (is_public, created_at desc);

-- 소셜(item_likes / item_wishlists / item_ratings / item_downloads /
-- item_comments / item_reports)은 target_type 폴리모픽 구조입니다.
-- target_type 체크 제약이 있다면 'wallpaper' 를 허용하도록 확장하세요:
--   alter table public.item_likes drop constraint if exists item_likes_target_type_check;
--   alter table public.item_likes add constraint item_likes_target_type_check
--     check (target_type in ('icon','pack','wallpaper'));
-- (item_wishlists, item_ratings, item_downloads, item_comments, item_reports 도 동일)
-- 카운터 트리거/ increment_item_view 함수도 target_type='wallpaper' 일 때
-- public.market_wallpapers 를 갱신하도록 분기를 추가해야 합니다.
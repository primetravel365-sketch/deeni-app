begin;
create schema if not exists islamiyat_admin;
revoke all on schema islamiyat_admin from public;
create table islamiyat_admin.members (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create function public.islamiyat_is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select from islamiyat_admin.members where user_id = auth.uid()) $$;
revoke all on function public.islamiyat_is_admin() from public;
grant execute on function public.islamiyat_is_admin() to authenticated;
create table public.islamiyat_offers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-F0-9]{32}$'),
  kind text not null check (kind in ('days', 'lifetime', 'discount')),
  amount integer,
  check ((kind='lifetime' and amount is null) or
    (kind='days' and amount is not null and amount between 1 and 3650) or
    (kind='discount' and amount is not null and amount between 1 and 100)),
  max_uses integer not null check (max_uses between 1 and 10000),
  uses integer not null default 0 check (uses between 0 and max_uses),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.islamiyat_offers enable row level security;
revoke all on public.islamiyat_offers from public, anon, authenticated;
grant select on public.islamiyat_offers to authenticated;
grant insert (code,kind,amount,max_uses), update (enabled) on public.islamiyat_offers to authenticated;
create policy admin_read on public.islamiyat_offers for select to authenticated using (public.islamiyat_is_admin());
create policy admin_create on public.islamiyat_offers for insert to authenticated with check (public.islamiyat_is_admin());
create policy admin_update on public.islamiyat_offers for update to authenticated using (public.islamiyat_is_admin()) with check (public.islamiyat_is_admin());
commit;

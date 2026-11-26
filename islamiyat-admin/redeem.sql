-- Apply after setup.sql. End user code redemption is authorized by Supabase Auth.
begin;
create table if not exists public.islamiyat_prime_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz
);
create table if not exists islamiyat_admin.redemptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid not null references public.islamiyat_offers(id),
  redeemed_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);
alter table public.islamiyat_prime_grants enable row level security;
alter table islamiyat_admin.redemptions enable row level security;
revoke all on public.islamiyat_prime_grants from public, anon, authenticated;
revoke all on islamiyat_admin.redemptions from public, anon, authenticated;
grant select on public.islamiyat_prime_grants to authenticated;
drop policy if exists islamiyat_read_own_prime on public.islamiyat_prime_grants;
create policy islamiyat_read_own_prime on public.islamiyat_prime_grants for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function islamiyat_admin.redeem_prime(p_code text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  offer public.islamiyat_offers%rowtype;
  expiry timestamptz;
begin
  if account_id is null then raise exception 'Authentication required'; end if;
  if p_code is null or p_code !~ '^[A-Fa-f0-9]{32}$' then raise exception 'Code unavailable'; end if;
  select * into offer from public.islamiyat_offers
    where code = upper(p_code) for update;
  if offer.id is null or offer.kind not in ('days','lifetime') then
    raise exception 'Code unavailable';
  end if;
  if exists (select 1 from islamiyat_admin.redemptions
             where user_id = account_id and offer_id = offer.id) then
    select expires_at into expiry from public.islamiyat_prime_grants where user_id = account_id;
    return jsonb_build_object('expires_at', expiry, 'already_redeemed', true);
  end if;
  if not offer.enabled or offer.uses >= offer.max_uses then raise exception 'Code unavailable'; end if;
  insert into islamiyat_admin.redemptions (user_id,offer_id) values (account_id,offer.id);
  update public.islamiyat_offers set uses = uses + 1 where id = offer.id;
  insert into public.islamiyat_prime_grants as grant_row (user_id,expires_at)
  values (account_id,case when offer.kind = 'days' then now() + make_interval(days => offer.amount) end)
  on conflict (user_id) do update set expires_at =
    case when grant_row.expires_at is null or excluded.expires_at is null then null
         else greatest(now(),grant_row.expires_at) + make_interval(days => offer.amount) end
  returning expires_at into expiry;
  return jsonb_build_object('expires_at',expiry,'already_redeemed',false);
end;
$$;
revoke all on function islamiyat_admin.redeem_prime(text) from public, anon, authenticated;
grant usage on schema islamiyat_admin to authenticated;
grant execute on function islamiyat_admin.redeem_prime(text) to authenticated;

create or replace function public.islamiyat_redeem_prime(p_code text) returns jsonb
language sql security invoker set search_path = ''
as $$ select islamiyat_admin.redeem_prime(p_code) $$;
revoke all on function public.islamiyat_redeem_prime(text) from public, anon, authenticated;
grant execute on function public.islamiyat_redeem_prime(text) to authenticated;
commit;

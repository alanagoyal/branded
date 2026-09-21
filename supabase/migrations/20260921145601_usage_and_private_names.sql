-- Server-only, durable accounting. One lock per user serializes requests across features/instances.
create table public.provider_usage (
 user_id uuid not null references auth.users(id) on delete cascade, feature text not null,
 month date not null, attempts integer not null default 0, primary key(user_id,feature,month)
);
create table public.provider_rate_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null default now(), attempts integer not null default 0
);
alter table public.provider_usage enable row level security;
alter table public.provider_rate_limits enable row level security;
revoke all on public.provider_usage,public.provider_rate_limits from public,anon,authenticated;
grant all on public.provider_usage,public.provider_rate_limits to service_role;
create function public.reserve_provider_usage(p_user_id uuid,p_feature text,p_limit integer)
returns text language plpgsql security invoker set search_path='' as $$
declare r public.provider_rate_limits; n integer;
 m date := date_trunc('month',now() at time zone 'UTC')::date;
begin
 if p_limit < 1 or p_feature not in ('names','domains','npm','npmAvailability','logos','trademarks','onePagerContent','onePager') then
 raise exception 'Invalid usage reservation'; end if;
 insert into public.provider_rate_limits(user_id) values(p_user_id) on conflict do nothing;
 select * into r from public.provider_rate_limits where user_id=p_user_id for update;
 if r.window_start <= now()-interval '1 minute' then
 update public.provider_rate_limits set window_start=now(),attempts=0 where user_id=p_user_id;
 elsif r.attempts >= 20 then return 'rate'; end if;
 insert into public.provider_usage(user_id,feature,month) values(p_user_id,p_feature,m) on conflict do nothing;
 select attempts into n from public.provider_usage where user_id=p_user_id and feature=p_feature and month=m;
 if n >= p_limit then return 'monthly'; end if;
 update public.provider_usage set attempts=attempts+1 where user_id=p_user_id and feature=p_feature and month=m;
 update public.provider_rate_limits set attempts=attempts+1 where user_id=p_user_id;
 return 'ok';
end $$;
revoke all on function public.reserve_provider_usage(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.reserve_provider_usage(uuid,text,integer) to service_role;
-- Drop permissive production variants as well as the checked-in policies.
do $$ declare p record; begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('names','npm_names') loop
 execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
end $$;
revoke all on public.names,public.npm_names from public,anon,authenticated;
grant select,insert,update,delete on public.names,public.npm_names to authenticated;
create policy names_owner on public.names for all to authenticated
using ((select auth.uid())=created_by) with check ((select auth.uid())=created_by);
create policy npm_owner on public.npm_names for all to authenticated
using ((select auth.uid())=created_by)
with check ((select auth.uid())=created_by and exists (
 select 1 from public.names n where n.id=name_id and n.created_by=(select auth.uid())
));
-- Only the server can issue/read share tokens, after verifying every name belongs to the caller.
create table public.name_shares (
 token uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id) on delete cascade,
 name_ids uuid[] not null check(cardinality(name_ids) between 1 and 20),
 created_at timestamptz not null default now(), unique(created_by,name_ids)
);
alter table public.name_shares enable row level security;
revoke all on public.name_shares from public,anon,authenticated;
grant all on public.name_shares to service_role;

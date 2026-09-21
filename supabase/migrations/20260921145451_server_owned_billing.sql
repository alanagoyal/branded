-- Never backfill ownership from the formerly client-writable profile columns.
alter table public.profiles add column if not exists customer_id text;
alter table public.profiles add column if not exists plan_id text;
revoke all on public.profiles from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.profiles from authenticated;
grant update (name, email, updated_at) on public.profiles to authenticated;
-- Profiles are created by the existing auth.users trigger, not the browser.

create table public.billing_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  customer_id text not null unique,
  plan_id text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro', 'business')),
  subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  revision bigint not null default 0
);
alter table public.billing_accounts enable row level security;
revoke all on public.billing_accounts from public, anon, authenticated;
grant select on public.billing_accounts to authenticated;
grant all on public.billing_accounts to service_role;
create policy "Owners can read billing" on public.billing_accounts for select to authenticated
using ((select auth.uid()) = user_id);

create table public.billing_webhook_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);
alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_webhook_events from public, anon, authenticated;
grant all on public.billing_webhook_events to service_role;

-- Compare-and-swap guards concurrent Stripe fetches; duplicate marking and state
-- writes commit together. Callers must fetch current Stripe state again on false.
create function public.apply_billing_snapshot(
  p_customer_id text, p_revision bigint, p_snapshot jsonb, p_event_id text default null
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare account public.billing_accounts;
begin
  select * into account from public.billing_accounts where customer_id = p_customer_id for update;
  if not found then raise exception 'Unknown billing customer'; end if;
  if p_event_id is not null and exists (
    select 1 from public.billing_webhook_events where event_id = p_event_id
  ) then return true; end if;
  if account.revision <> p_revision then return false; end if;
  update public.billing_accounts set
    plan_id = p_snapshot->>'plan_id', plan_tier = p_snapshot->>'plan_tier',
    subscription_id = p_snapshot->>'subscription_id',
    subscription_status = p_snapshot->>'subscription_status',
    current_period_end = (p_snapshot->>'current_period_end')::timestamptz,
    cancel_at_period_end = (p_snapshot->>'cancel_at_period_end')::boolean,
    revision = revision + 1
  where user_id = account.user_id;
  update public.profiles set customer_id = account.customer_id, plan_id = p_snapshot->>'plan_id'
  where id = account.user_id;
  if p_event_id is not null then
    insert into public.billing_webhook_events(event_id) values (p_event_id);
  end if;
  return true;
end;
$$;
revoke all on function public.apply_billing_snapshot(text,bigint,jsonb,text) from public, anon, authenticated;
grant execute on function public.apply_billing_snapshot(text,bigint,jsonb,text) to service_role;

-- Freeze a single checkout attempt per customer. Parallel tabs/plans must not
-- create two subscriptions, including requests across an idempotency time bucket.
alter table public.billing_accounts
  add column checkout_token uuid,
  add column checkout_plan text check (checkout_plan in ('pro', 'business')),
  add column checkout_expires_at timestamptz;
create function public.reserve_billing_checkout(p_user_id uuid, p_plan text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare account public.billing_accounts;
begin
  if p_plan not in ('pro', 'business') then raise exception 'Invalid checkout plan'; end if;
  select * into account from public.billing_accounts where user_id = p_user_id for update;
  if not found then raise exception 'Unknown billing user'; end if;
  if account.checkout_token is null or account.checkout_expires_at <= now() then
    update public.billing_accounts set checkout_token = gen_random_uuid(),
      checkout_plan = p_plan, checkout_expires_at = date_trunc('second', now()) + interval '35 minutes'
    where user_id = p_user_id returning * into account;
  end if;
  return jsonb_build_object('token', account.checkout_token, 'plan', account.checkout_plan,
    'expires_at', extract(epoch from account.checkout_expires_at)::bigint);
end;
$$;
revoke all on function public.reserve_billing_checkout(uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_billing_checkout(uuid,text) to service_role;

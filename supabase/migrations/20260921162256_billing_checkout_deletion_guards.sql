-- A durable intent, not a lease: a slow/crashed request must never reopen billing
-- while account deletion might still be running. Only the server can clear it.
alter table public.profiles add column account_deletion_token uuid;

create function public.begin_account_deletion(p_user_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare profile public.profiles; token uuid;
begin
  select * into profile from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  if profile.account_deletion_token is not null then return null; end if;
  -- All checkout reservations lock this same profile first, including a newly
  -- created billing account. This also fences requests authenticated earlier.
  if exists (select 1 from public.billing_accounts where user_id = p_user_id
    and checkout_expires_at > now()) then return null; end if;
  token := gen_random_uuid();
  update public.profiles set account_deletion_token = token where id = p_user_id;
  return token;
end;
$$;

create function public.finish_account_deletion(p_user_id uuid, p_token uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.profiles set account_deletion_token = null
  where id = p_user_id and account_deletion_token = p_token;
$$;

create or replace function public.reserve_billing_checkout(p_user_id uuid, p_plan text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare account public.billing_accounts; profile public.profiles;
begin
  if p_plan not in ('pro', 'business') then raise exception 'Invalid checkout plan'; end if;
  select * into profile from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  if profile.account_deletion_token is not null then return null; end if;
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

-- Used only after Stripe rejects expires_at before executing creation. Keep the
-- same token/idempotency key; never discard an ambiguous network/Stripe failure.
create function public.renew_billing_checkout(p_user_id uuid, p_token uuid, p_expires_at bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare account public.billing_accounts; profile public.profiles;
begin
  select * into profile from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  if profile.account_deletion_token is not null then return null; end if;
  select * into account from public.billing_accounts where user_id = p_user_id for update;
  if not found or account.checkout_token is distinct from p_token then return null; end if;
  if extract(epoch from account.checkout_expires_at)::bigint = p_expires_at then
    update public.billing_accounts set checkout_expires_at = date_trunc('second', now()) + interval '35 minutes'
    where user_id = p_user_id returning * into account;
  end if;
  return jsonb_build_object('token', account.checkout_token, 'plan', account.checkout_plan,
    'expires_at', extract(epoch from account.checkout_expires_at)::bigint);
end;
$$;

revoke all on function public.begin_account_deletion(uuid), public.finish_account_deletion(uuid,uuid),
  public.renew_billing_checkout(uuid,uuid,bigint) from public, anon, authenticated;
grant execute on function public.begin_account_deletion(uuid), public.finish_account_deletion(uuid,uuid),
  public.renew_billing_checkout(uuid,uuid,bigint) to service_role;

create or replace function public.apply_billing_snapshot(
  p_customer_id text, p_revision bigint, p_snapshot jsonb, p_event_id text default null
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare account public.billing_accounts; owner_id uuid;
begin
  -- Use the same profile -> billing lock order as checkout and deletion.
  select user_id into owner_id from public.billing_accounts where customer_id = p_customer_id;
  if not found then raise exception 'Unknown billing customer'; end if;
  perform 1 from public.profiles where id = owner_id for update;
  if not found then raise exception 'Unknown billing user'; end if;
  select * into account from public.billing_accounts where customer_id = p_customer_id and user_id = owner_id for update;
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

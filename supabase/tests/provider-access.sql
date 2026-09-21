-- Run after usage_and_private_names migration in a disposable DB, inside a transaction.
insert into auth.users(id) values ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
insert into public.profiles(id) values ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.names(id,name,created_by) values
 ('20000000-0000-4000-8000-000000000001','Owner name','10000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000002','Other name','10000000-0000-4000-8000-000000000002');
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$ begin
 if (select count(*) from public.names) != 1 then raise exception 'Names leaked'; end if;
 begin
  insert into public.names(name,created_by) values ('forged','10000000-0000-4000-8000-000000000002');
  raise exception 'Forged ownership accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.names set created_by='10000000-0000-4000-8000-000000000002';
  raise exception 'Ownership transfer accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.npm_names(name_id,created_by) values ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001');
  raise exception 'Foreign parent accepted';
 exception when insufficient_privilege then null; end;
 begin perform public.reserve_provider_usage('10000000-0000-4000-8000-000000000001','names',99999);
  raise exception 'Client quota bypass accepted';
 exception when insufficient_privilege then null; end;
 begin perform * from public.name_shares; raise exception 'Tokens enumerable';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.npm_names(id,name_id,created_by) values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$ begin
 if (select count(*) from public.npm_names) != 0 then raise exception 'npm rows leaked'; end if;
 delete from public.npm_names; if found then raise exception 'Foreign npm deleted'; end if;
 update public.npm_names set npm_name='hijack'; if found then raise exception 'Foreign npm updated'; end if;
end $$;
reset role;
set role anon;
do $$ begin
 begin perform * from public.names; raise exception 'Anonymous enumeration accepted';
 exception when insufficient_privilege then null; end;
 begin insert into public.names(name) values ('anonymous'); raise exception 'Anonymous insert accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set role service_role;
do $$ begin
 if public.reserve_provider_usage('10000000-0000-4000-8000-000000000001','logos',1) != 'ok' then raise exception 'First attempt denied'; end if;
 if public.reserve_provider_usage('10000000-0000-4000-8000-000000000001','logos',1) != 'monthly' then raise exception 'Quota bypass'; end if;
 -- A new feature cannot bypass the shared burst counter.
 update public.provider_rate_limits set attempts=20 where user_id='10000000-0000-4000-8000-000000000001';
 if public.reserve_provider_usage('10000000-0000-4000-8000-000000000001','names',100) != 'rate' then raise exception 'Burst bypass'; end if;
 update public.provider_rate_limits set window_start=now()-interval '2 minutes' where user_id='10000000-0000-4000-8000-000000000001';
 if public.reserve_provider_usage('10000000-0000-4000-8000-000000000001','names',100) != 'ok' then raise exception 'Window did not reset'; end if;
 if (select attempts from public.provider_rate_limits where user_id='10000000-0000-4000-8000-000000000001') != 1 then raise exception 'Bad reset accounting'; end if;
end $$;
reset role;

create table "public"."names" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "description" text not null,
    "name" text not null,
    "word_to_include" text,
    "min_length" bigint,
    "max_length" bigint,
    "created_by" uuid,
    "word_placement" text,
    "word_style" text,
    "favorited" boolean default false
);


alter table "public"."names" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "updated_at" timestamp with time zone,
    "email" text,
    "name" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX domain_names_pkey ON public.names USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."names" add constraint "domain_names_pkey" PRIMARY KEY using index "domain_names_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."names" add constraint "public_names_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."names" validate constraint "public_names_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$function$
;

grant delete on table "public"."names" to "anon";

grant insert on table "public"."names" to "anon";

grant references on table "public"."names" to "anon";

grant select on table "public"."names" to "anon";

grant trigger on table "public"."names" to "anon";

grant truncate on table "public"."names" to "anon";

grant update on table "public"."names" to "anon";

grant delete on table "public"."names" to "authenticated";

grant insert on table "public"."names" to "authenticated";

grant references on table "public"."names" to "authenticated";

grant select on table "public"."names" to "authenticated";

grant trigger on table "public"."names" to "authenticated";

grant truncate on table "public"."names" to "authenticated";

grant update on table "public"."names" to "authenticated";

grant delete on table "public"."names" to "service_role";

grant insert on table "public"."names" to "service_role";

grant references on table "public"."names" to "service_role";

grant select on table "public"."names" to "service_role";

grant trigger on table "public"."names" to "service_role";

grant truncate on table "public"."names" to "service_role";

grant update on table "public"."names" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

create policy "Enable read access for all users"
on "public"."names"
as permissive
for all
to public
using (true);


create policy "Enable insert for users based on user_id"
on "public"."profiles"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Enable update for users based on email"
on "public"."profiles"
as permissive
for update
to public
using (((auth.jwt() ->> 'email'::text) = email))
with check (((auth.jwt() ->> 'email'::text) = email));



CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();



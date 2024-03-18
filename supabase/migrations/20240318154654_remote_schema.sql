alter table "public"."names" add column "created_by" uuid;

alter table "public"."names" add column "favorited" boolean default false;

alter table "public"."names" add column "max_length" bigint;

alter table "public"."names" add column "min_length" bigint;

alter table "public"."names" add column "word_placement" text;

alter table "public"."names" add column "word_style" text;

alter table "public"."names" add column "word_to_include" text;

alter table "public"."names" alter column "description" set not null;

alter table "public"."profiles" drop column "first_name";

alter table "public"."profiles" drop column "last_name";

alter table "public"."profiles" add column "created_at" timestamp with time zone default now();

alter table "public"."profiles" add column "name" text;

alter table "public"."profiles" enable row level security;

alter table "public"."names" add constraint "public_names_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."names" validate constraint "public_names_created_by_fkey";

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




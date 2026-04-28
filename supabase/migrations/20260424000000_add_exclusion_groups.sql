create table "public"."exclusion_groups" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id"),
    foreign key ("event_id") references "public"."events"("id") on delete cascade
);

create table "public"."exclusion_group_members" (
    "id" uuid not null default gen_random_uuid(),
    "group_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id"),
    foreign key ("group_id") references "public"."exclusion_groups"("id") on delete cascade,
    foreign key ("user_id") references "public"."users"("id") on delete cascade
);

alter table "public"."exclusion_groups" enable row level security;
alter table "public"."exclusion_group_members" enable row level security;

create policy "Only creator can manage exclusion groups"
  on "public"."exclusion_groups"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = exclusion_groups.event_id) AND (events.creator_id = auth.uid())))));

create policy "Only creator can manage exclusion group members"
  on "public"."exclusion_group_members"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.exclusion_groups
   JOIN public.events ON events.id = exclusion_groups.event_id
  WHERE ((exclusion_groups.id = exclusion_group_members.group_id) AND (events.creator_id = auth.uid())))));

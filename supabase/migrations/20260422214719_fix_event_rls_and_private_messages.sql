create type "public"."event_status" as enum ('open', 'drawn', 'finished');


  create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "creator_id" uuid not null,
    "name" text not null,
    "reveal_date" timestamp with time zone,
    "description" text,
    "status" public.event_status default 'open'::public.event_status,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."events" enable row level security;


  create table "public"."exclusions" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "user_a_id" uuid not null,
    "user_b_id" uuid not null
      );


alter table "public"."exclusions" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "sender_id" uuid not null,
    "text" text not null,
    "reactions" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."messages" enable row level security;


  create table "public"."participants" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "user_id" uuid not null,
    "wishlist" text,
    "drawn_id" uuid
      );


alter table "public"."participants" enable row level security;


  create table "public"."private_messages" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "sender_id" uuid not null,
    "recipient_id" uuid not null,
    "text" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."private_messages" enable row level security;


  create table "public"."users" (
    "id" uuid not null default auth.uid(),
    "email" text not null,
    "name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "is_admin" boolean default false
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX eventos_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX exclusoes_evento_id_usuario_a_id_usuario_b_id_key ON public.exclusions USING btree (event_id, user_a_id, user_b_id);

CREATE UNIQUE INDEX exclusoes_pkey ON public.exclusions USING btree (id);

CREATE UNIQUE INDEX mensagens_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX mensagens_privadas_pkey ON public.private_messages USING btree (id);

CREATE UNIQUE INDEX participantes_evento_id_usuario_id_key ON public.participants USING btree (event_id, user_id);

CREATE UNIQUE INDEX participantes_pkey ON public.participants USING btree (id);

CREATE UNIQUE INDEX usuarios_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX usuarios_pkey ON public.users USING btree (id);

alter table "public"."events" add constraint "eventos_pkey" PRIMARY KEY using index "eventos_pkey";

alter table "public"."exclusions" add constraint "exclusoes_pkey" PRIMARY KEY using index "exclusoes_pkey";

alter table "public"."messages" add constraint "mensagens_pkey" PRIMARY KEY using index "mensagens_pkey";

alter table "public"."participants" add constraint "participantes_pkey" PRIMARY KEY using index "participantes_pkey";

alter table "public"."private_messages" add constraint "mensagens_privadas_pkey" PRIMARY KEY using index "mensagens_privadas_pkey";

alter table "public"."users" add constraint "usuarios_pkey" PRIMARY KEY using index "usuarios_pkey";

alter table "public"."events" add constraint "eventos_criador_id_fkey" FOREIGN KEY (creator_id) REFERENCES public.users(id) not valid;

alter table "public"."events" validate constraint "eventos_criador_id_fkey";

alter table "public"."exclusions" add constraint "exclusoes_evento_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."exclusions" validate constraint "exclusoes_evento_id_fkey";

alter table "public"."exclusions" add constraint "exclusoes_evento_id_usuario_a_id_usuario_b_id_key" UNIQUE using index "exclusoes_evento_id_usuario_a_id_usuario_b_id_key";

alter table "public"."exclusions" add constraint "exclusoes_usuario_a_id_fkey" FOREIGN KEY (user_a_id) REFERENCES public.users(id) not valid;

alter table "public"."exclusions" validate constraint "exclusoes_usuario_a_id_fkey";

alter table "public"."exclusions" add constraint "exclusoes_usuario_b_id_fkey" FOREIGN KEY (user_b_id) REFERENCES public.users(id) not valid;

alter table "public"."exclusions" validate constraint "exclusoes_usuario_b_id_fkey";

alter table "public"."messages" add constraint "mensagens_evento_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "mensagens_evento_id_fkey";

alter table "public"."messages" add constraint "mensagens_remetente_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.users(id) not valid;

alter table "public"."messages" validate constraint "mensagens_remetente_id_fkey";

alter table "public"."participants" add constraint "participantes_evento_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."participants" validate constraint "participantes_evento_id_fkey";

alter table "public"."participants" add constraint "participantes_evento_id_usuario_id_key" UNIQUE using index "participantes_evento_id_usuario_id_key";

alter table "public"."participants" add constraint "participantes_sorteado_id_fkey" FOREIGN KEY (drawn_id) REFERENCES public.users(id) not valid;

alter table "public"."participants" validate constraint "participantes_sorteado_id_fkey";

alter table "public"."participants" add constraint "participantes_usuario_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."participants" validate constraint "participantes_usuario_id_fkey";

alter table "public"."private_messages" add constraint "mensagens_privadas_destinatario_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.users(id) not valid;

alter table "public"."private_messages" validate constraint "mensagens_privadas_destinatario_id_fkey";

alter table "public"."private_messages" add constraint "mensagens_privadas_evento_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."private_messages" validate constraint "mensagens_privadas_evento_id_fkey";

alter table "public"."private_messages" add constraint "mensagens_privadas_remetente_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.users(id) not valid;

alter table "public"."private_messages" validate constraint "mensagens_privadas_remetente_id_fkey";

alter table "public"."users" add constraint "usuarios_email_key" UNIQUE using index "usuarios_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_admin_metrics()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_is_admin BOOLEAN;
  v_mau INT;
  v_events_open INT;
  v_events_finished INT;
  v_events_drawn INT;
  v_total_participants INT;
  v_participants_with_wishlist INT;
  v_engagement_rate NUMERIC;
  v_messages_24h INT;
  v_private_messages_24h INT;
  v_total_msgs_24h INT;
  v_result JSON;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acesso negado: Requer privilégios de administrador';
  END IF;

  SELECT COUNT(*) INTO v_mau FROM public.users;
  SELECT COUNT(*) INTO v_events_open FROM public.events WHERE status = 'open';
  SELECT COUNT(*) INTO v_events_finished FROM public.events WHERE status = 'finished';
  SELECT COUNT(*) INTO v_events_drawn FROM public.events WHERE status = 'drawn';

  SELECT COUNT(*) INTO v_total_participants FROM public.participants;
  SELECT COUNT(*) INTO v_participants_with_wishlist FROM public.participants WHERE wishlist IS NOT NULL AND wishlist != '';
  
  IF v_total_participants > 0 THEN
    v_engagement_rate := (v_participants_with_wishlist::NUMERIC / v_total_participants::NUMERIC) * 100;
  ELSE
    v_engagement_rate := 0;
  END IF;

  SELECT COUNT(*) INTO v_messages_24h FROM public.messages WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT COUNT(*) INTO v_private_messages_24h FROM public.private_messages WHERE created_at >= NOW() - INTERVAL '24 hours';
  v_total_msgs_24h := v_messages_24h + v_private_messages_24h;

  v_result := json_build_object(
    'mau', v_mau,
    'events', json_build_object(
      'open', v_events_open,
      'drawn', v_events_drawn,
      'finished', v_events_finished
    ),
    'engagement', json_build_object(
      'total_participants', v_total_participants,
      'with_wishlist', v_participants_with_wishlist,
      'rate_percentage', ROUND(v_engagement_rate, 2)
    ),
    'messages_24h', v_total_msgs_24h
  );
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_event(p_id uuid)
 RETURNS SETOF public.events
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.events WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.send_anonymous_message(p_event_id uuid, p_text text, p_to_drawer boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_recipient_id uuid;
BEGIN
  IF p_to_drawer THEN
    -- Find the person who drew me
    SELECT user_id INTO v_recipient_id
    FROM participants
    WHERE event_id = p_event_id AND drawn_id = auth.uid();
  ELSE
    -- Find the person I drew
    SELECT drawn_id INTO v_recipient_id
    FROM participants
    WHERE event_id = p_event_id AND user_id = auth.uid();
  END IF;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO private_messages (event_id, sender_id, recipient_id, text)
    VALUES (p_event_id, auth.uid(), v_recipient_id, p_text);
  ELSE
    RAISE EXCEPTION 'Destinatário não encontrado';
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_auth_uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT auth.uid();
$function$
;

create or replace view "public"."vw_participants" as  SELECT id,
    event_id,
    user_id,
    wishlist,
        CASE
            WHEN (user_id = auth.uid()) THEN drawn_id
            ELSE NULL::uuid
        END AS drawn_id
   FROM public.participants;


grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."exclusions" to "anon";

grant insert on table "public"."exclusions" to "anon";

grant references on table "public"."exclusions" to "anon";

grant select on table "public"."exclusions" to "anon";

grant trigger on table "public"."exclusions" to "anon";

grant truncate on table "public"."exclusions" to "anon";

grant update on table "public"."exclusions" to "anon";

grant delete on table "public"."exclusions" to "authenticated";

grant insert on table "public"."exclusions" to "authenticated";

grant references on table "public"."exclusions" to "authenticated";

grant select on table "public"."exclusions" to "authenticated";

grant trigger on table "public"."exclusions" to "authenticated";

grant truncate on table "public"."exclusions" to "authenticated";

grant update on table "public"."exclusions" to "authenticated";

grant delete on table "public"."exclusions" to "service_role";

grant insert on table "public"."exclusions" to "service_role";

grant references on table "public"."exclusions" to "service_role";

grant select on table "public"."exclusions" to "service_role";

grant trigger on table "public"."exclusions" to "service_role";

grant truncate on table "public"."exclusions" to "service_role";

grant update on table "public"."exclusions" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."participants" to "anon";

grant insert on table "public"."participants" to "anon";

grant references on table "public"."participants" to "anon";

grant select on table "public"."participants" to "anon";

grant trigger on table "public"."participants" to "anon";

grant truncate on table "public"."participants" to "anon";

grant update on table "public"."participants" to "anon";

grant delete on table "public"."participants" to "authenticated";

grant insert on table "public"."participants" to "authenticated";

grant references on table "public"."participants" to "authenticated";

grant select on table "public"."participants" to "authenticated";

grant trigger on table "public"."participants" to "authenticated";

grant truncate on table "public"."participants" to "authenticated";

grant update on table "public"."participants" to "authenticated";

grant delete on table "public"."participants" to "service_role";

grant insert on table "public"."participants" to "service_role";

grant references on table "public"."participants" to "service_role";

grant select on table "public"."participants" to "service_role";

grant trigger on table "public"."participants" to "service_role";

grant truncate on table "public"."participants" to "service_role";

grant update on table "public"."participants" to "service_role";

grant delete on table "public"."private_messages" to "anon";

grant insert on table "public"."private_messages" to "anon";

grant references on table "public"."private_messages" to "anon";

grant select on table "public"."private_messages" to "anon";

grant trigger on table "public"."private_messages" to "anon";

grant truncate on table "public"."private_messages" to "anon";

grant update on table "public"."private_messages" to "anon";

grant delete on table "public"."private_messages" to "authenticated";

grant insert on table "public"."private_messages" to "authenticated";

grant references on table "public"."private_messages" to "authenticated";

grant select on table "public"."private_messages" to "authenticated";

grant trigger on table "public"."private_messages" to "authenticated";

grant truncate on table "public"."private_messages" to "authenticated";

grant update on table "public"."private_messages" to "authenticated";

grant delete on table "public"."private_messages" to "service_role";

grant insert on table "public"."private_messages" to "service_role";

grant references on table "public"."private_messages" to "service_role";

grant select on table "public"."private_messages" to "service_role";

grant trigger on table "public"."private_messages" to "service_role";

grant truncate on table "public"."private_messages" to "service_role";

grant update on table "public"."private_messages" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Creators can update their events"
  on "public"."events"
  as permissive
  for update
  to public
using ((auth.uid() = creator_id));



  create policy "Users can create events"
  on "public"."events"
  as permissive
  for insert
  to public
with check ((auth.uid() = creator_id));



  create policy "Users can view events they participate in"
  on "public"."events"
  as permissive
  for select
  to public
using (((auth.uid() = creator_id) OR (EXISTS ( SELECT 1
   FROM public.participants p
  WHERE ((p.event_id = events.id) AND (p.user_id = auth.uid()))))));



  create policy "Only creator can manage exclusions"
  on "public"."exclusions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = exclusions.event_id) AND (events.creator_id = auth.uid())))));



  create policy "Participants can insert messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.participants
  WHERE ((participants.event_id = messages.event_id) AND (participants.user_id = auth.uid()))))));



  create policy "Participants can update messages"
  on "public"."messages"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.participants
  WHERE ((participants.event_id = messages.event_id) AND (participants.user_id = auth.uid())))));



  create policy "Participants can view messages"
  on "public"."messages"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.participants
  WHERE ((participants.event_id = messages.event_id) AND (participants.user_id = auth.uid())))));



  create policy "Users can join events as participants"
  on "public"."participants"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view participants of their events"
  on "public"."participants"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.participants p
  WHERE ((p.event_id = participants.event_id) AND (p.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = participants.event_id) AND (e.creator_id = auth.uid()))))));



  create policy "Users can update their own participant record"
  on "public"."participants"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Only sender or recipient can view private messages"
  on "public"."private_messages"
  as permissive
  for select
  to public
using (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));



  create policy "Users can send private messages"
  on "public"."private_messages"
  as permissive
  for insert
  to public
with check ((auth.uid() = sender_id));



  create policy "Users can insert their own profile"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update their own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view shared profiles"
  on "public"."users"
  as permissive
  for select
  to public
using (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM public.participants p1
  WHERE ((p1.user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.participants p2
  WHERE ((p2.event_id = p1.event_id) AND (p2.user_id = users.id)))))))));




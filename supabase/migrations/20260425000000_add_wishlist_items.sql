CREATE TABLE public.wishlist_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    item text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view wishlist items in their events"
ON public.wishlist_items
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.id = wishlist_items.participant_id
        AND p.event_id IN (
            SELECT event_id FROM public.participants p2 WHERE p2.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage their own wishlist items"
ON public.wishlist_items
FOR ALL
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.id = wishlist_items.participant_id
        AND p.user_id = auth.uid()
    )
);

-- Migrate existing wishlist data
INSERT INTO public.wishlist_items (participant_id, item)
SELECT
    id AS participant_id,
    trim(unnest(string_to_array(wishlist, E'\n'))) AS item
FROM public.participants
WHERE wishlist IS NOT NULL AND trim(wishlist) != '';

-- Delete empty items if any got created
DELETE FROM public.wishlist_items WHERE trim(item) = '';

-- Update admin metrics function to check wishlist_items instead of participants.wishlist
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

  -- Count how many participants have at least one wishlist item
  SELECT COUNT(DISTINCT participant_id) INTO v_participants_with_wishlist FROM public.wishlist_items;

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
$function$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO anon, authenticated, service_role;

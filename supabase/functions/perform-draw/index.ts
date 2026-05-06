import { createClient } from "jsr:@supabase/supabase-js@2";

interface Participant {
  id: string;
  user_id: string;
}

interface Exclusion {
  user_a_id: string;
  user_b_id: string;
}

/**
 * Backtracking algorithm to build a valid derangement (f(i) != i)
 * with exclusion and non-reciprocity constraints.
 *
 * @param participants - List of participants (giver order)
 * @param exclusions   - Set of forbidden (giver, receiver) pairs
 * @returns Map from giver user_id -> receiver user_id, or null if impossible
 */
function smartDraw(
  participants: Participant[],
  exclusions: Exclusion[],
): Map<string, string> | null {
  const ids = participants.map((p) => p.user_id);
  const forbidden = new Set<string>(
    exclusions.flatMap((e) => [
      `${e.user_a_id}->${e.user_b_id}`,
      `${e.user_b_id}->${e.user_a_id}`,
    ]),
  );

  const assignment = new Map<string, string>(); // giver -> receiver
  const receiverUsed = new Set<string>();

  function isValid(giver: string, receiver: string): boolean {
    // Cannot draw yourself
    if (giver === receiver) return false;
    // Cannot draw someone already assigned
    if (receiverUsed.has(receiver)) return false;
    // Cannot draw a forbidden pair
    if (forbidden.has(`${giver}->${receiver}`)) return false;
    // Non-reciprocity: if someone already has giver as their receiver, giver cannot draw them
    if (assignment.get(receiver) === giver) return false;
    return true;
  }

  function backtrack(index: number): boolean {
    if (index === ids.length) return true;

    const giver = ids[index];
    // Shuffle receivers for randomness using Fisher-Yates
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const receiver of shuffled) {
      if (isValid(giver, receiver)) {
        assignment.set(giver, receiver);
        receiverUsed.add(receiver);

        if (backtrack(index + 1)) return true;

        assignment.delete(giver);
        receiverUsed.delete(receiver);
      }
    }

    return false;
  }

  const success = backtrack(0);
  return success ? assignment : null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const allowedOrigins = [
    "http://localhost:3000",
    Deno.env.get("ALLOWED_ORIGIN"),
  ].filter(Boolean) as string[];

  const corsHeaders = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    ...(origin && allowedOrigins.includes(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : { "Access-Control-Allow-Origin": allowedOrigins[0] || "*" }),
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create user-level client to verify identity
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create service_role client to bypass RLS
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 5. Verify the caller is the event creator
    const { data: event, error: eventError } = await serviceClient
      .from("events")
      .select("id, creator_id, status")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: "Event não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event.creator_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Apenas o criador do event pode realizar o sorteio." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (event.status !== "open") {
      return new Response(
        JSON.stringify({ error: `O event já está com status '${event.status}'.` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 6. Fetch all participants and exclusions using service_role (bypasses RLS)
    const { data: participants, error: partError } = await serviceClient
      .from("participants")
      .select("id, user_id")
      .eq("event_id", event_id);

    if (partError || !participants || participants.length < 2) {
      return new Response(
        JSON.stringify({ error: "O event precisa de pelo menos 2 participants." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    const { data: exclusions, error: exclusionsError } = await serviceClient
      .from("exclusions")
      .select("user_a_id, user_b_id")
      .eq("event_id", event_id);

    if (exclusionsError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar exclusões." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: exclusionGroups, error: groupError } = await serviceClient
      .from("exclusion_groups")
      .select("id, name")
      .eq("event_id", event_id);

    if (groupError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar grupos de exclusão." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allExclusions = [...(exclusions || [])];

    if (exclusionGroups && exclusionGroups.length > 0) {
      const groupIds = exclusionGroups.map(g => g.id);
      const { data: groupMembers, error: memberError } = await serviceClient
        .from("exclusion_group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      if (memberError) {
        return new Response(JSON.stringify({ error: "Erro ao buscar membros de grupos de exclusão." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (groupMembers) {
        const membersByGroup = groupMembers.reduce((acc, member) => {
          if (!acc[member.group_id]) {
            acc[member.group_id] = [];
          }
          acc[member.group_id].push(member.user_id);
          return acc;
        }, {});

        for (const groupId in membersByGroup) {
          const members = membersByGroup[groupId];
          for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
              allExclusions.push({
                user_a_id: members[i],
                user_b_id: members[j]
              });
            }
          }
        }
      }
    }

    // 7. Run the Smart Draw algorithm
    const result = smartDraw(participants, allExclusions);


    if (!result) {
      return new Response(
        JSON.stringify({
          error:
            "Sorteio impossível com as restrições atuais. Reduza as exclusões e tente novamente.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 8. Persist results: update drawn_id for each participant in bulk
    const updates = participants.map((p) => ({
      id: p.id,
      event_id: event_id,
      user_id: p.user_id,
      drawn_id: result.get(p.user_id)!,
    }));

    const { error: updateError } = await serviceClient
      .from("participants")
      .upsert(updates);

    if (updateError) {
      throw new Error(`Erro ao salvar sorteio: ${updateError.message}`);
    }

    // 9. Update event status to 'drawn'
    const { error: statusError } = await serviceClient
      .from("events")
      .update({ status: "drawn" })
      .eq("id", event_id);

    if (statusError) {
      throw new Error(`Erro ao atualizar status do event: ${statusError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Sorteio realizado com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("perform-draw error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

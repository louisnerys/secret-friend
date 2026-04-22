import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Participant {
  id: string;
  usuario_id: string;
}

interface Exclusion {
  usuario_a_id: string;
  usuario_b_id: string;
}

/**
 * Backtracking algorithm to build a valid derangement (f(i) != i)
 * with exclusion and non-reciprocity constraints.
 *
 * @param participants - List of participants (giver order)
 * @param exclusions   - Set of forbidden (giver, receiver) pairs
 * @returns Map from giver usuario_id -> receiver usuario_id, or null if impossible
 */
function smartDraw(
  participants: Participant[],
  exclusions: Exclusion[],
): Map<string, string> | null {
  const ids = participants.map((p) => p.usuario_id);
  const forbidden = new Set<string>(
    exclusions.flatMap((e) => [
      `${e.usuario_a_id}->${e.usuario_b_id}`,
      `${e.usuario_b_id}->${e.usuario_a_id}`,
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
    // Shuffle receivers for randomness
    const shuffled = [...ids].sort(() => Math.random() - 0.5);

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
    const { evento_id } = await req.json();
    if (!evento_id) {
      return new Response(JSON.stringify({ error: "evento_id is required" }), {
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
    const { data: evento, error: eventoError } = await serviceClient
      .from("eventos")
      .select("id, criador_id, status")
      .eq("id", evento_id)
      .single();

    if (eventoError || !evento) {
      return new Response(JSON.stringify({ error: "Evento não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (evento.criador_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Apenas o criador do evento pode realizar o sorteio." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (evento.status !== "aberto") {
      return new Response(
        JSON.stringify({ error: `O evento já está com status '${evento.status}'.` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 6. Fetch all participants and exclusions using service_role (bypasses RLS)
    const { data: participants, error: partError } = await serviceClient
      .from("participantes")
      .select("id, usuario_id")
      .eq("evento_id", evento_id);

    if (partError || !participants || participants.length < 2) {
      return new Response(
        JSON.stringify({ error: "O evento precisa de pelo menos 2 participantes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: exclusoes, error: exclusoesError } = await serviceClient
      .from("exclusoes")
      .select("usuario_a_id, usuario_b_id")
      .eq("evento_id", evento_id);

    if (exclusoesError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar exclusões." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Run the Smart Draw algorithm
    const result = smartDraw(participants, exclusoes ?? []);

    if (!result) {
      return new Response(
        JSON.stringify({
          error:
            "Sorteio impossível com as restrições atuais. Reduza as exclusões e tente novamente.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 8. Persist results: update sorteado_id for each participant
    const updates = participants.map((p) => ({
      id: p.id,
      sorteado_id: result.get(p.usuario_id)!,
    }));

    for (const update of updates) {
      const { error: updateError } = await serviceClient
        .from("participantes")
        .update({ sorteado_id: update.sorteado_id })
        .eq("id", update.id);

      if (updateError) {
        throw new Error(`Erro ao salvar sorteio para participante ${update.id}: ${updateError.message}`);
      }
    }

    // 9. Update event status to 'sorteado'
    const { error: statusError } = await serviceClient
      .from("eventos")
      .update({ status: "sorteado" })
      .eq("id", evento_id);

    if (statusError) {
      throw new Error(`Erro ao atualizar status do evento: ${statusError.message}`);
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

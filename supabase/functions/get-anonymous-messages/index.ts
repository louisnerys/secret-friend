import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANONYMOUS_DISPLAY_NAME = "Seu Amigo Secreto";

interface PrivateMessage {
  id: string;
  evento_id: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  criado_at: string;
}

interface SanitizedMessage {
  id: string;
  evento_id: string;
  remetente_display: string;
  is_mine: boolean;
  texto: string;
  criado_at: string;
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

    // 2. Parse evento_id from query params or body
    const url = new URL(req.url);
    let evento_id = url.searchParams.get("evento_id");

    if (!evento_id && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      evento_id = body.evento_id ?? null;
    }

    if (!evento_id) {
      return new Response(JSON.stringify({ error: "evento_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify user identity via user-scoped client
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

    const callerId = user.id;

    // 4. Fetch messages where the caller is involved (sender or recipient)
    // Use user-scoped client — RLS on mensagens_privadas already restricts to sender/recipient
    const { data: messages, error: msgError } = await userClient
      .from("mensagens_privadas")
      .select("id, evento_id, remetente_id, destinatario_id, texto, criado_at")
      .eq("evento_id", evento_id)
      .order("criado_at", { ascending: true });

    if (msgError) {
      console.error("get-anonymous-messages fetch error:", msgError);
      return new Response(JSON.stringify({ error: "Erro ao buscar mensagens." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Sanitize: strip real sender UUID for messages not sent by the caller
    const sanitized: SanitizedMessage[] = (messages as PrivateMessage[]).map((msg) => {
      const isMyMessage = msg.remetente_id === callerId;
      return {
        id: msg.id,
        evento_id: msg.evento_id,
        // CRITICAL: Never expose the real remetente_id of someone else
        remetente_display: isMyMessage ? "Você" : ANONYMOUS_DISPLAY_NAME,
        is_mine: isMyMessage,
        texto: msg.texto,
        criado_at: msg.criado_at,
        // remetente_id and destinatario_id are intentionally OMITTED from the response
      };
    });

    // 6. Return sanitized payload with strict cache-control
    return new Response(JSON.stringify({ messages: sanitized }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Prevent caching to avoid leaking another session's data
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (err) {
    console.error("get-anonymous-messages error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

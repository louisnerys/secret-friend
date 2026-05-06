import { createClient } from "jsr:@supabase/supabase-js@2";

const ANONYMOUS_DISPLAY_NAME = "Seu Amigo Secreto";

interface PrivateMessage {
  id: string;
  event_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
}

interface SanitizedMessage {
  id: string;
  event_id: string;
  sender_display: string;
  is_mine: boolean;
  text: string;
  created_at: string;
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

    // 2. Parse event_id from query params or body
    const url = new URL(req.url);
    let event_id = url.searchParams.get("event_id");

    if (!event_id && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      event_id = body.event_id ?? null;
    }

    if (!event_id) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
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

    // Fetch the person the caller drew to classify messages
    const { data: myPart } = await userClient
      .from("participants")
      .select("drawn_id")
      .eq("event_id", event_id)
      .eq("user_id", callerId)
      .single();
    
    const myDrawnId = myPart?.drawn_id;

    // 4. Fetch messages where the caller is involved (sender or recipient)
    // Use user-scoped client — RLS on private_messages already restricts to sender/recipient
    const { data: messages, error: msgError } = await userClient
      .from("private_messages")
      .select("id, event_id, sender_id, recipient_id, text, created_at")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("get-anonymous-messages fetch error:", msgError);
      return new Response(JSON.stringify({ error: "Erro ao buscar messages." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Sanitize: strip real sender UUID for messages not sent by the caller
    const sanitized: SanitizedMessage[] = (messages as PrivateMessage[]).map((msg) => {
      const isMyMessage = msg.sender_id === callerId;
      
      let chat_type = "drawer";
      if (myDrawnId) {
        if (msg.recipient_id === myDrawnId || msg.sender_id === myDrawnId) {
          chat_type = "drawn";
        }
      }

      return {
        id: msg.id,
        event_id: msg.event_id,
        // CRITICAL: Never expose the real sender_id of someone else
        sender_display: isMyMessage ? "Você" : ANONYMOUS_DISPLAY_NAME,
        is_mine: isMyMessage,
        chat_type: chat_type as any,
        text: msg.text,
        created_at: msg.created_at,
        // sender_id and recipient_id are intentionally OMITTED from the response
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

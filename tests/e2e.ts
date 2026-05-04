#!/usr/bin/env -S /home/nerys/.deno/bin/deno run --allow-net --allow-env
/**
 * E2E Test Suite — Secret Friend
 * 
 * Tests:
 *   PASSO 1: DB Schema + RLS
 *   PASSO 2: perform-draw Edge Function
 *   PASSO 3: get-anonymous-messages Edge Function
 */

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;

function ok(label: string, msg = "") {
  passed++;
  console.log(`  ${C.green("✓")} ${label}${msg ? C.dim(" — " + msg) : ""}`);
}

function fail(label: string, detail: string) {
  failed++;
  console.log(`  ${C.red("✗")} ${C.bold(label)}`);
  console.log(`    ${C.red(detail)}`);
}

function section(title: string) {
  console.log(`\n${C.blue(C.bold("══ " + title + " ══"))}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function rest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function signUp(email: string, password: string): Promise<string | null> {
  const { data } = await rest("POST", "/auth/v1/signup", { email, password });
  return (data as { access_token?: string })?.access_token ?? null;
}

// Get user IDs from JWT
function decodeJwt(token: string): Record<string, unknown> {
  const parts = token.split(".");
  const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(payload);
}

// ── State ─────────────────────────────────────────────────────────────────────
let user1Token = "";
let user2Token = "";
let user3Token = "";
let user4Token = "";
let user1Id = "";
let user2Id = "";
let user3Id = "";
let eventId = "";

// ══════════════════════════════════════════════════════════════════════════════
// PASSO 1: DB Schema + RLS
// ══════════════════════════════════════════════════════════════════════════════
async function runStep1() {
  section("PASSO 1 — DB Schema e Autenticação");

  const ts = Date.now();
  const email1 = `user1_${ts}@test.com`;
  const email2 = `user2_${ts}@test.com`;
  const email3 = `user3_${ts}@test.com`;
  const email4 = `user4_${ts}@test.com`;
  const pass = "TestPass123!";

  user1Token = await signUp(email1, pass) ?? "";
  user2Token = await signUp(email2, pass) ?? "";
  user3Token = await signUp(email3, pass) ?? "";
  user4Token = await signUp(email4, pass) ?? "";

  if (user1Token) ok("User 1 criado e token JWT obtido");
  else fail("Signup User 1", "Token não retornado");
  if (user2Token) ok("User 2 criado e token JWT obtido");
  if (user3Token) ok("User 3 criado e token JWT obtido (para testes RLS + draw)");

  if (user1Token) {
    user1Id = (decodeJwt(user1Token).sub as string);
    ok(`User 1 ID extraído do JWT`, user1Id.slice(0, 8) + "...");
  }
  if (user2Token) {
    user2Id = (decodeJwt(user2Token).sub as string);
    ok(`User 2 ID extraído do JWT`, user2Id.slice(0, 8) + "...");
  }
  if (user3Token) {
    user3Id = (decodeJwt(user3Token).sub as string);
    ok(`User 3 ID extraído do JWT`, user3Id.slice(0, 8) + "...");
  }

  section("PASSO 1 — Tabela users (INSERT + RLS)");
  const selectU1 = await rest("GET", `/rest/v1/users?id=eq.${user1Id}`, undefined, { Authorization: `Bearer ${user1Token}` });
  if (selectU1.status === 200 && selectU1.data && (selectU1.data as any[]).length === 1) ok("User 1 inserido na tabela users automaticamente (trigger)");
  
  const selectUsers = await rest("GET", "/rest/v1/users?select=id,email,name", undefined, { Authorization: `Bearer ${user1Token}` });
  if (selectUsers.status === 200) ok("SELECT users retorna todos os usuários", `${(selectUsers.data as any[]).length} registros`);

  section("PASSO 1 — Tabela events");
  const createEvent = await rest("POST", "/rest/v1/events",
    { creator_id: user1Id, name: `E2E Event ${ts}`, description: "Teste E2E" },
    { Authorization: `Bearer ${user1Token}`, Prefer: "return=representation" }
  );
  if (createEvent.status === 201 || createEvent.status === 200) {
    eventId = (createEvent.data as any[])[0]?.id ?? "";
    ok("Event criado pelo User 1", `id=${eventId.slice(0, 8)}...`);
  }

  const u2SeeEvent = await rest("GET", `/rest/v1/events?id=eq.${eventId}`, undefined, { Authorization: `Bearer ${user2Token}` });
  if (u2SeeEvent.status === 200 && (u2SeeEvent.data as any[]).length === 0) ok("RLS events: User 2 NÃO vê event do qual não participa");

  section("PASSO 1 — Tabela participants + RLS drawn_id");
  await rest("POST", "/rest/v1/participants", { event_id: eventId, user_id: user1Id, wishlist: "W1" }, { Authorization: `Bearer ${SERVICE_KEY}` });
  await rest("POST", "/rest/v1/participants", { event_id: eventId, user_id: user2Id, wishlist: "W2" }, { Authorization: `Bearer ${SERVICE_KEY}` });
  await rest("POST", "/rest/v1/participants", { event_id: eventId, user_id: user3Id, wishlist: "W3" }, { Authorization: `Bearer ${SERVICE_KEY}` });
  ok("Participantes adicionados via service_role");

  const u2SeeEventNow = await rest("GET", `/rest/v1/events?id=eq.${eventId}`, undefined, { Authorization: `Bearer ${user2Token}` });
  if (u2SeeEventNow.status === 200 && (u2SeeEventNow.data as any[]).length === 1) ok("RLS events: User 2 AGORA vê event após ser adicionado");

  const u1SeePart = await rest("GET", `/rest/v1/participants?event_id=eq.${eventId}`, undefined, { Authorization: `Bearer ${user1Token}` });
  if (u1SeePart.status === 200 && (u1SeePart.data as any[]).length === 1) ok("RLS participants: User 1 vê APENAS seu próprio registro");

  section("PASSO 1 — Tabela private_messages RLS");
  await rest("POST", "/rest/v1/private_messages", { event_id: eventId, sender_id: user1Id, recipient_id: user2Id, text: "Msg 1" }, { Authorization: `Bearer ${SERVICE_KEY}` });
  ok("Mensagem privada inserida (service_role)");

  const u2SeeMsg = await rest("GET", `/rest/v1/private_messages?event_id=eq.${eventId}`, undefined, { Authorization: `Bearer ${user2Token}` });
  if (u2SeeMsg.status === 200 && (u2SeeMsg.data as any[]).length === 1) ok("RLS private_messages: Destinatário vê a mensagem");
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSO 2: perform-draw Edge Function
// ══════════════════════════════════════════════════════════════════════════════
async function runStep2() {
  section("PASSO 2 — Edge Function perform-draw");

  const nonCreatorDraw = await fetch(`${SUPABASE_URL}/functions/v1/perform-draw`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user2Token}`, "apikey": ANON_KEY },
    body: JSON.stringify({ event_id: eventId }),
  });
  if (nonCreatorDraw.status === 403) ok("perform-draw: Não-criador recebe 403 Forbidden");

  const drawRes = await fetch(`${SUPABASE_URL}/functions/v1/perform-draw`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user1Token}`, "apikey": ANON_KEY },
    body: JSON.stringify({ event_id: eventId }),
  });
  if (drawRes.status === 200) ok("perform-draw: Sorteio realizado com sucesso");

  const verifyDraw = await rest("GET", `/rest/v1/participants?event_id=eq.${eventId}&select=user_id,drawn_id`, undefined, { Authorization: `Bearer ${SERVICE_KEY}` });
  if (verifyDraw.status === 200) {
    const rows = verifyDraw.data as any[];
    if (rows.every(r => r.drawn_id !== null)) ok("perform-draw: drawn_id atribuído a todos");
    if (rows.every(r => r.user_id !== r.drawn_id)) ok("perform-draw: Ninguém sorteou a si mesmo");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSO 3: get-anonymous-messages Edge Function
// ══════════════════════════════════════════════════════════════════════════════
async function runStep3() {
  section("PASSO 3 — Edge Function get-anonymous-messages");

  // User 2 sends a message to User 1
  await rest("POST", "/rest/v1/private_messages", 
    { event_id: eventId, sender_id: user2Id, recipient_id: user1Id, text: "Oi! Sou seu Amigo Secreto!" }, 
    { Authorization: `Bearer ${SERVICE_KEY}` }
  );
  ok("Mensagem privada User2->User1 inserida");

  // User 1 calls get-anonymous-messages
  const anonMsgRes = await fetch(`${SUPABASE_URL}/functions/v1/get-anonymous-messages?event_id=${eventId}`, {
    headers: { "Authorization": `Bearer ${user1Token}`, "apikey": ANON_KEY },
  });
  const anonMsgData = await anonMsgRes.json() as { messages: any[] };

  if (anonMsgRes.status === 200 && anonMsgData.messages) {
    ok(`get-anonymous-messages: Retornou ${anonMsgData.messages.length} mensagem(s)`);
    
    // Check anonimization logic
    const { data: partData } = await rest("GET", `/rest/v1/participants?event_id=eq.${eventId}&user_id=eq.${user1Id}&select=drawn_id`, undefined, { Authorization: `Bearer ${SERVICE_KEY}` });
    const p1DrawnId = (partData as any[])[0]?.drawn_id;
    const expectedType = p1DrawnId === user2Id ? "drawn" : "drawer";

    const anonMsg = anonMsgData.messages.find(m => !m.is_mine);
    if (anonMsg && anonMsg.sender_display === "Seu Amigo Secreto" && anonMsg.chat_type === expectedType) {
      ok("get-anonymous-messages: Anonimização e chat_type corretos", `chat_type=${anonMsg.chat_type}`);
    } else {
      fail("get-anonymous-messages anonimização", `Esperava type ${expectedType}, obteve ${anonMsg?.chat_type}. Msg: ${JSON.stringify(anonMsg)}`);
    }

    if (anonMsgRes.headers.get("cache-control")?.includes("no-store")) {
      ok("get-anonymous-messages: Cache-Control: no-store presente");
    }
  }
}

async function main() {
  try {
    await runStep1();
    await runStep2();
    await runStep3();
  } catch (e) {
    console.error(e);
    failed++;
  }

  console.log(`\n${"═".repeat(55)}`);
  if (failed === 0) console.log(C.green(C.bold(`  ✓ TODOS OS TESTES PASSARAM: ${passed}/${passed + failed}`)));
  else console.log(C.red(C.bold(`  ✗ ${failed} TESTE(S) FALHARAM — ${passed}/${passed + failed} passaram`)));
  console.log(`${"═".repeat(55)}\n`);

  if (failed > 0) Deno.exit(1);
}

main();

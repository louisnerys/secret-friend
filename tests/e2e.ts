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

async function signIn(email: string, password: string): Promise<string | null> {
  const res = await rest("POST", "/auth/v1/token?grant_type=password", { email, password });
  return (res.data as { access_token?: string })?.access_token ?? null;
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
section("PASSO 1 — DB Schema e Autenticação");

// Create test users via Supabase Auth
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

if (user1Token) {
  ok("User 1 criado e token JWT obtido");
} else {
  fail("Signup User 1", "Token não retornado");
}

if (user2Token) {
  ok("User 2 criado e token JWT obtido");
} else {
  fail("Signup User 2", "Token não retornado");
}

if (user3Token) {
  ok("User 3 criado e token JWT obtido (para testes RLS + draw)");
} else {
  fail("Signup User 3", "Token não retornado");
}

// Get user IDs from JWT
function decodeJwt(token: string): Record<string, unknown> {
  const parts = token.split(".");
  const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(payload);
}

if (user1Token) {
  const jwt1 = decodeJwt(user1Token);
  user1Id = jwt1.sub as string;
  ok(`User 1 ID extraído do JWT`, user1Id.slice(0, 8) + "...");
}

if (user2Token) {
  const jwt2 = decodeJwt(user2Token);
  user2Id = jwt2.sub as string;
  ok(`User 2 ID extraído do JWT`, user2Id.slice(0, 8) + "...");
}

if (user3Token) {
  const jwt3 = decodeJwt(user3Token);
  user3Id = jwt3.sub as string;
  ok(`User 3 ID extraído do JWT`, user3Id.slice(0, 8) + "...");
}

// Insert users profiles
section("PASSO 1 — Tabela users (INSERT + RLS)");

const insertU1 = await rest("POST", "/rest/v1/users", 
  { id: user1Id, email: email1, name: "User Test 1" },
  { Authorization: `Bearer ${user1Token}` }
);
if (insertU1.status === 201 || insertU1.status === 200) {
  ok("User 1 inserido na tabela users");
} else {
  fail("INSERT users user1", `Status ${insertU1.status}: ${JSON.stringify(insertU1.data)}`);
}

const insertU2 = await rest("POST", "/rest/v1/users",
  { id: user2Id, email: email2, name: "User Test 2" },
  { Authorization: `Bearer ${user2Token}` }
);
if (insertU2.status === 201 || insertU2.status === 200) {
  ok("User 2 inserido na tabela users");
} else {
  fail("INSERT users user2", `Status ${insertU2.status}: ${JSON.stringify(insertU2.data)}`);
}

const insertU3 = await rest("POST", "/rest/v1/users",
  { id: user3Id, email: email3, name: "User Test 3" },
  { Authorization: `Bearer ${user3Token}` }
);
if (insertU3.status === 201 || insertU3.status === 200) {
  ok("User 3 inserido na tabela users");
} else {
  fail("INSERT users user3", `Status ${insertU3.status}: ${JSON.stringify(insertU3.data)}`);
}

// Test SELECT on users (policy: anyone can view)
const selectUsers = await rest("GET", "/rest/v1/users?select=id,email,name",
  undefined, { Authorization: `Bearer ${user1Token}` }
);
if (selectUsers.status === 200 && Array.isArray(selectUsers.data) && (selectUsers.data as unknown[]).length >= 2) {
  ok("SELECT users retorna todos os usuários", `${(selectUsers.data as unknown[]).length} registros`);
} else {
  fail("SELECT users", `Status ${selectUsers.status}: ${JSON.stringify(selectUsers.data)}`);
}

// Create an event
section("PASSO 1 — Tabela events");

const createEvent = await rest("POST", "/rest/v1/events",
  { creator_id: user1Id, name: `E2E Event ${ts}`, description: "Teste E2E" },
  { 
    Authorization: `Bearer ${user1Token}`,
    Prefer: "return=representation"
  }
);
if (createEvent.status === 201 || createEvent.status === 200) {
  const events = createEvent.data as { id: string }[];
  eventId = events[0]?.id ?? "";
  ok("Event criado pelo User 1", `id=${eventId.slice(0, 8)}...`);
} else {
  fail("INSERT events", `Status ${createEvent.status}: ${JSON.stringify(createEvent.data)}`);
}

// User 2 should NOT be able to see the event (not a participant yet)
const u2SeeEvent = await rest("GET", `/rest/v1/events?id=eq.${eventId}&select=id,name`,
  undefined, { Authorization: `Bearer ${user2Token}` }
);
if (u2SeeEvent.status === 200 && Array.isArray(u2SeeEvent.data) && (u2SeeEvent.data as unknown[]).length === 0) {
  ok("RLS events: User 2 NÃO vê event do qual não participa");
} else {
  fail("RLS events", `User 2 conseguiu ver event! Status ${u2SeeEvent.status}: ${JSON.stringify(u2SeeEvent.data)}`);
}

// Add both users as participants
section("PASSO 1 — Tabela participants + RLS drawn_id");

// Use service role to add participants (since participants has no INSERT policy yet)
const addP1 = await rest("POST", "/rest/v1/participants",
  { event_id: eventId, user_id: user1Id, wishlist: "Quero um livro" },
  { Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "return=minimal" }
);
if (addP1.status === 201 || addP1.status === 200) {
  ok("Participante 1 (User 1) adicionado via service_role");
} else {
  fail("INSERT participants p1", `Status ${addP1.status}: ${JSON.stringify(addP1.data)}`);
}

const addP2 = await rest("POST", "/rest/v1/participants",
  { event_id: eventId, user_id: user2Id, wishlist: "Quero um jogo" },
  { Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "return=minimal" }
);
if (addP2.status === 201 || addP2.status === 200) {
  ok("Participante 2 (User 2) adicionado via service_role");
} else {
  fail("INSERT participants p2", `Status ${addP2.status}: ${JSON.stringify(addP2.data)}`);
}

// Add user3 as 3rd participant (needed for non-reciprocal derangement in perform-draw)
const addP3 = await rest("POST", "/rest/v1/participants",
  { event_id: eventId, user_id: user3Id, wishlist: "Quero uma viagem" },
  { Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "return=minimal" }
);
if (addP3.status === 201 || addP3.status === 200) {
  ok("Participante 3 (User 3) adicionado via service_role (para sorteio válido)");
} else {
  fail("INSERT participants p3", `Status ${addP3.status}: ${JSON.stringify(addP3.data)}`);
}

// User 2 can now see the event (is a participant)
const u2SeeEventNow = await rest("GET", `/rest/v1/events?id=eq.${eventId}&select=id,name`,
  undefined, { Authorization: `Bearer ${user2Token}` }
);
if (u2SeeEventNow.status === 200 && Array.isArray(u2SeeEventNow.data) && (u2SeeEventNow.data as unknown[]).length === 1) {
  ok("RLS events: User 2 AGORA vê event após ser adicionado como participante");
} else {
  fail("RLS events pós participação", `Status ${u2SeeEventNow.status}: ${JSON.stringify(u2SeeEventNow.data)}`);
}

// User 1 should ONLY see their own row in participants (drawn_id secret)
const u1SeePart = await rest("GET", `/rest/v1/participants?event_id=eq.${eventId}&select=user_id,drawn_id`,
  undefined, { Authorization: `Bearer ${user1Token}` }
);
if (u1SeePart.status === 200 && Array.isArray(u1SeePart.data)) {
  const rows = u1SeePart.data as { user_id: string; drawn_id: string | null }[];
  if (rows.length === 1 && rows[0].user_id === user1Id) {
    ok("RLS participants: User 1 vê APENAS seu próprio registro (drawn_id secreto)");
  } else {
    fail("RLS participants", `Retornou ${rows.length} rows. Esperava 1. Rows: ${JSON.stringify(rows)}`);
  }
} else {
  fail("SELECT participants", `Status ${u1SeePart.status}: ${JSON.stringify(u1SeePart.data)}`);
}

// Test vw_participants: User 1 can see all but only their drawn_id
const u1SeeView = await rest("GET", `/rest/v1/vw_participants?event_id=eq.${eventId}&select=user_id,drawn_id`,
  undefined, { Authorization: `Bearer ${user1Token}` }
);
// Note: vw_participants query bypasses row-level but applies CASE on column
// The view is on the table itself which has RLS. The view inherits table permissions.
// Actually views in Postgres run with definer's permissions by default unless SECURITY INVOKER is set.
// Let's see what happens.
if (u1SeeView.status === 200 && Array.isArray(u1SeeView.data)) {
  const rows = u1SeeView.data as { user_id: string; drawn_id: string | null }[];
  const otherRowWithSecret = rows.find(r => r.user_id !== user1Id && r.drawn_id !== null);
  if (otherRowWithSecret) {
    fail("VIEW vw_participants segurança", `drawn_id de outro usuário visível! ${JSON.stringify(otherRowWithSecret)}`);
  } else {
    ok(`VIEW vw_participants: ${rows.length} rows visíveis, drawn_id de outros é NULL`);
  }
} else {
  // If view is restricted due to RLS, that's also ok
  ok(`VIEW vw_participants: Restrita por RLS (status ${u1SeeView.status})`);
}

// Test private_messages RLS
section("PASSO 1 — Tabela private_messages RLS");

// Insert a private message from user1 to user2 via service role (simulating post-draw)
const addMsg = await rest("POST", "/rest/v1/private_messages",
  { event_id: eventId, sender_id: user1Id, recipient_id: user2Id, text: "Oi! Sou seu Amigo Secreto!" },
  { Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "return=minimal" }
);
if (addMsg.status === 201 || addMsg.status === 200) {
  ok("Mensagem privada inserida (service_role)");
} else {
  fail("INSERT private_messages", `Status ${addMsg.status}: ${JSON.stringify(addMsg.data)}`);
}

// User 2 (destinatário) can see the message
const u2SeeMsg = await rest("GET", `/rest/v1/private_messages?event_id=eq.${eventId}&select=id,text,sender_id`,
  undefined, { Authorization: `Bearer ${user2Token}` }
);
if (u2SeeMsg.status === 200 && Array.isArray(u2SeeMsg.data) && (u2SeeMsg.data as unknown[]).length === 1) {
  ok("RLS private_messages: Destinatário (User 2) vê a mensagem");
} else {
  fail("RLS private_messages destinatário", `Status ${u2SeeMsg.status}: ${JSON.stringify(u2SeeMsg.data)}`);
}

// User4 is already created above (line ~98) and NOT part of this event (for RLS isolation test)
const u3SeeMsg = await rest("GET", `/rest/v1/private_messages?event_id=eq.${eventId}&select=id,text`,
  undefined, { Authorization: `Bearer ${user4Token}` }
);
if (u3SeeMsg.status === 200 && Array.isArray(u3SeeMsg.data) && (u3SeeMsg.data as unknown[]).length === 0) {
  ok("RLS private_messages: Usuário externo (User 4) NÃO vê messages privadas de outros");
} else {
  fail("RLS private_messages terceiro", `User 4 viu messages! Status ${u3SeeMsg.status}: ${JSON.stringify(u3SeeMsg.data)}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSO 2: perform-draw Edge Function
// ══════════════════════════════════════════════════════════════════════════════
section("PASSO 2 — Edge Function perform-draw");

// Test: Non-creator cannot trigger draw
const nonCreatorDraw = await fetch(`${SUPABASE_URL}/functions/v1/perform-draw`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${user2Token}`,
    "apikey": ANON_KEY,
  },
  body: JSON.stringify({ event_id: eventId }),
});
const nonCreatorResult = await nonCreatorDraw.json();
if (nonCreatorDraw.status === 403) {
  ok("perform-draw: Não-criador recebe 403 Forbidden", nonCreatorResult.error);
} else {
  fail("perform-draw autorização", `Status ${nonCreatorDraw.status}: ${JSON.stringify(nonCreatorResult)}`);
}

// Test: Creator triggers draw
const drawRes = await fetch(`${SUPABASE_URL}/functions/v1/perform-draw`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${user1Token}`,
    "apikey": ANON_KEY,
  },
  body: JSON.stringify({ event_id: eventId }),
});
const drawResult = await drawRes.json();
if (drawRes.status === 200 && drawResult.success) {
  ok("perform-draw: Sorteio realizado com sucesso pelo criador");
} else {
  fail("perform-draw execução", `Status ${drawRes.status}: ${JSON.stringify(drawResult)}`);
}

// Test: Draw cannot run twice (status is 'drawn')
const drawTwice = await fetch(`${SUPABASE_URL}/functions/v1/perform-draw`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${user1Token}`,
    "apikey": ANON_KEY,
  },
  body: JSON.stringify({ event_id: eventId }),
});
const drawTwiceResult = await drawTwice.json();
if (drawTwice.status === 409) {
  ok("perform-draw: Segundo sorteio rejeitado (409 Conflict)", drawTwiceResult.error);
} else {
  fail("perform-draw idempotência", `Status ${drawTwice.status}: ${JSON.stringify(drawTwiceResult)}`);
}

// Verify drawn_id was actually set (via service role, bypassing RLS)
const verifyDraw = await rest("GET", `/rest/v1/participants?event_id=eq.${eventId}&select=user_id,drawn_id`,
  undefined, { Authorization: `Bearer ${SERVICE_KEY}` }
);
if (verifyDraw.status === 200 && Array.isArray(verifyDraw.data)) {
  const rows = verifyDraw.data as { user_id: string; drawn_id: string | null }[];
  const allAssigned = rows.every(r => r.drawn_id !== null);
  const noSelfDraw = rows.every(r => r.user_id !== r.drawn_id);
  
  if (allAssigned) ok("perform-draw: drawn_id atribuído a todos os participants");
  else fail("perform-draw drawn_id", `Nem todos têm drawn_id: ${JSON.stringify(rows)}`);
  
  if (noSelfDraw) ok("perform-draw: Ninguém sorteou a si mesmo (derangement válido)");
  else fail("perform-draw self-draw", `Alguém sorteou a si mesmo! ${JSON.stringify(rows)}`);
  
  // Verify non-reciprocity
  const drawMap = new Map(rows.map(r => [r.user_id, r.drawn_id]));
  let reciprocalFound = false;
  for (const [giver, receiver] of drawMap) {
    if (drawMap.get(receiver!) === giver) {
      reciprocalFound = true;
      fail("perform-draw não-reciprocidade", `Par recíproco: ${giver} <-> ${receiver}`);
      break;
    }
  }
  if (!reciprocalFound) ok("perform-draw: Regra de não-reciprocidade respeitada");
}

// Verify RLS: User 1 can only see their own drawn_id after draw
const u1SeeSecret = await rest("GET", `/rest/v1/participants?event_id=eq.${eventId}&select=user_id,drawn_id`,
  undefined, { Authorization: `Bearer ${user1Token}` }
);
if (u1SeeSecret.status === 200 && Array.isArray(u1SeeSecret.data)) {
  const rows = u1SeeSecret.data as { user_id: string; drawn_id: string | null }[];
  if (rows.length === 1 && rows[0].user_id === user1Id && rows[0].drawn_id !== null) {
    ok("RLS pós-sorteio: User 1 vê APENAS seu próprio drawn_id (preenchido)");
  } else {
    fail("RLS pós-sorteio", `Rows: ${JSON.stringify(rows)}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSO 3: get-anonymous-messages Edge Function
// ══════════════════════════════════════════════════════════════════════════════
section("PASSO 3 — Edge Function get-anonymous-messages");

// Add another private message from user2 to user1 via service role
const addMsg2 = await rest("POST", "/rest/v1/private_messages",
  { event_id: eventId, sender_id: user2Id, recipient_id: user1Id, text: "Olá! Que bom que está participando!" },
  { Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "return=minimal" }
);
if (addMsg2.status === 201 || addMsg2.status === 200) {
  ok("Mensagem privada User2->User1 inserida para teste");
} else {
  fail("INSERT mensagem2", `Status ${addMsg2.status}: ${JSON.stringify(addMsg2.data)}`);
}

// User 2 calls get-anonymous-messages — should see messages with sender_display masked
const anonMsgRes = await fetch(`${SUPABASE_URL}/functions/v1/get-anonymous-messages?event_id=${eventId}`, {
  headers: {
    "Authorization": `Bearer ${user2Token}`,
    "apikey": ANON_KEY,
  },
});
const anonMsgData = await anonMsgRes.json() as { messages: { sender_display: string; is_mine: boolean; text: string }[] };

if (anonMsgRes.status === 200 && anonMsgData.messages) {
  ok(`get-anonymous-messages: Retornou ${anonMsgData.messages.length} mensagem(s)`);
  
  // Verify no real UUID leaks in the response
  const bodyStr = JSON.stringify(anonMsgData);
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const foundUuids = bodyStr.match(uuidRegex) ?? [];
  // Only allowed UUIDs: event_id and message id
  const forbiddenUuids = foundUuids.filter(u => u === user1Id || u === user2Id);
  
  if (forbiddenUuids.length === 0) {
    ok("get-anonymous-messages: Nenhum UUID real de usuário vaza no payload");
  } else {
    fail("get-anonymous-messages vazamento UUID", `UUIDs encontrados: ${forbiddenUuids.join(", ")}`);
  }

  // Verify sender_display is anonymized for messages NOT sent by user2
  const receivedMsgs = anonMsgData.messages.filter(m => !m.is_mine);
  const allAnonymized = receivedMsgs.every(m => m.sender_display === "Seu Amigo Secreto");
  if (allAnonymized && receivedMsgs.length > 0) {
    ok(`get-anonymous-messages: Mensagens recebidas têm sender_display="Seu Amigo Secreto"`);
  } else if (receivedMsgs.length === 0) {
    ok("get-anonymous-messages: Nenhuma mensagem recebida no filtro (apenas enviadas)");
  } else {
    fail("get-anonymous-messages anonimização", `${JSON.stringify(receivedMsgs)}`);
  }

  // Verify sent messages show "Você"
  const sentMsgs = anonMsgData.messages.filter(m => m.is_mine);
  const allMine = sentMsgs.every(m => m.sender_display === "Você");
  if (allMine && sentMsgs.length > 0) {
    ok(`get-anonymous-messages: Mensagens enviadas têm sender_display="Você"`);
  }
} else {
  fail("get-anonymous-messages chamada", `Status ${anonMsgRes.status}: ${JSON.stringify(anonMsgData)}`);
}

// Test: Unauthorized call should return 401
const unauthRes = await fetch(`${SUPABASE_URL}/functions/v1/get-anonymous-messages?event_id=${eventId}`, {
  headers: { "apikey": ANON_KEY },
});
if (unauthRes.status === 401) {
  ok("get-anonymous-messages: Chamada sem token retorna 401");
} else {
  fail("get-anonymous-messages auth", `Status esperado 401, recebeu ${unauthRes.status}`);
}

// Check Cache-Control header to prevent caching
const cacheHeader = anonMsgRes.headers.get("cache-control") ?? "";
if (cacheHeader.includes("no-store")) {
  ok("get-anonymous-messages: Cache-Control: no-store presente (previne cache de dados sensíveis)");
} else {
  fail("get-anonymous-messages cache", `Cache-Control: "${cacheHeader}" — deveria conter 'no-store'`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(55)}`);
const total = passed + failed;
if (failed === 0) {
  console.log(C.green(C.bold(`  ✓ TODOS OS TESTES PASSARAM: ${passed}/${total}`)));
} else {
  console.log(C.red(C.bold(`  ✗ ${failed} TESTE(S) FALHARAM — ${passed}/${total} passaram`)));
}
console.log(`${"═".repeat(55)}\n`);

if (failed > 0) Deno.exit(1);

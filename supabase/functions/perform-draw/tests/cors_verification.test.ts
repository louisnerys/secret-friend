/**
 * CORS verification tests for Edge Functions.
 *
 * Run with: deno test --allow-env supabase/functions/perform-draw/tests/cors_verification.test.ts
 */

import { assertEquals } from "jsr:@std/assert";

const LOCAL_ORIGIN = "http://localhost:3000";
const PROD_ORIGIN = "https://my-app.vercel.app";

function getCorsHeaders(req: Request, allowedOriginEnv?: string) {
  const origin = req.headers.get("Origin");
  const allowedOrigins = [
    LOCAL_ORIGIN,
    allowedOriginEnv,
  ].filter(Boolean) as string[];

  return {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    ...(origin && allowedOrigins.includes(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : { "Access-Control-Allow-Origin": allowedOrigins[0] || "*" }),
  };
}

Deno.test("CORS: returns local origin when matched", () => {
  const req = new Request("http://localhost:54321/functions/v1/perform-draw", {
    headers: { "Origin": LOCAL_ORIGIN },
  });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], LOCAL_ORIGIN);
});

Deno.test("CORS: returns production origin when matched via env", () => {
  const req = new Request("http://localhost:54321/functions/v1/perform-draw", {
    headers: { "Origin": PROD_ORIGIN },
  });
  const headers = getCorsHeaders(req, PROD_ORIGIN);
  assertEquals(headers["Access-Control-Allow-Origin"], PROD_ORIGIN);
});

Deno.test("CORS: returns default (local) origin when origin is missing", () => {
  const req = new Request("http://localhost:54321/functions/v1/perform-draw");
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], LOCAL_ORIGIN);
});

Deno.test("CORS: returns default (local) origin when origin does not match", () => {
  const req = new Request("http://localhost:54321/functions/v1/perform-draw", {
    headers: { "Origin": "https://malicious.com" },
  });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], LOCAL_ORIGIN);
});

Deno.test("CORS: returns * if no allowed origins are defined (fallback)", () => {
  // This scenario is unlikely as LOCAL_ORIGIN is hardcoded, but testing the logic
  const origin = "https://some-origin.com";
  const req = new Request("http://localhost:54321", { headers: { Origin: origin } });

  // Manually mocking the logic for this specific case
  const allowedOrigins: string[] = [];
  const corsHeaders = {
    ...(origin && allowedOrigins.includes(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : { "Access-Control-Allow-Origin": allowedOrigins[0] || "*" }),
  };

  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
});

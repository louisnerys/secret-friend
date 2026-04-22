/**
 * Unit tests for the Smart Draw algorithm.
 * Extracted logic (no Supabase/HTTP dependencies).
 *
 * Run with: deno test supabase/functions/perform-draw/tests/smart-draw.test.ts
 */

import { assertEquals, assertNotEquals } from "jsr:@std/assert";

interface Participant {
  id: string;
  usuario_id: string;
}

interface Exclusion {
  usuario_a_id: string;
  usuario_b_id: string;
}

// ── Algorithm under test (copied here to isolate from HTTP handler) ──────────

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

  const assignment = new Map<string, string>();
  const receiverUsed = new Set<string>();

  function isValid(giver: string, receiver: string): boolean {
    if (giver === receiver) return false;
    if (receiverUsed.has(receiver)) return false;
    if (forbidden.has(`${giver}->${receiver}`)) return false;
    if (assignment.get(receiver) === giver) return false;
    return true;
  }

  function backtrack(index: number): boolean {
    if (index === ids.length) return true;
    const giver = ids[index];
    // Deterministic order for unit tests (no shuffle)
    for (const receiver of ids) {
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

  return backtrack(0) ? assignment : null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeParticipants(ids: string[]): Participant[] {
  return ids.map((id) => ({ id, usuario_id: id }));
}

function validateDerangement(
  result: Map<string, string>,
  participants: Participant[],
  exclusions: Exclusion[],
): void {
  const ids = participants.map((p) => p.usuario_id);

  // Every participant must be assigned
  assertEquals(result.size, ids.length, "All givers must be assigned");

  // Every receiver is unique (bijection)
  const receivers = [...result.values()];
  assertEquals(new Set(receivers).size, ids.length, "All receivers must be distinct");

  // Derangement: no one draws themselves
  for (const [giver, receiver] of result) {
    assertNotEquals(giver, receiver, `${giver} cannot draw themselves`);
  }

  // Non-reciprocity: if A->B, then B->A is forbidden
  for (const [giver, receiver] of result) {
    const reverseReceiver = result.get(receiver);
    assertNotEquals(
      reverseReceiver,
      giver,
      `Reciprocal pair detected: ${giver} <-> ${receiver}`,
    );
  }

  // Exclusions are respected
  const forbidden = new Set(
    exclusions.flatMap((e) => [
      `${e.usuario_a_id}->${e.usuario_b_id}`,
      `${e.usuario_b_id}->${e.usuario_a_id}`,
    ]),
  );
  for (const [giver, receiver] of result) {
    const key = `${giver}->${receiver}`;
    assertEquals(forbidden.has(key), false, `Forbidden pair used: ${key}`);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test("Basic derangement: 4 participants, no exclusions", () => {
  const participants = makeParticipants(["A", "B", "C", "D"]);
  const result = smartDraw(participants, []);

  assertNotEquals(result, null, "Should find a valid assignment");
  validateDerangement(result!, participants, []);
});

Deno.test("4 participants with 1 exclusion pair — finds the constrained solution", () => {
  // A and B cannot draw each other. The algorithm must route around it.
  const participants = makeParticipants(["A", "B", "C", "D"]);
  const exclusions: Exclusion[] = [
    { usuario_a_id: "A", usuario_b_id: "B" },
  ];

  const result = smartDraw(participants, exclusions);
  assertNotEquals(result, null, "Should find a valid assignment");
  validateDerangement(result!, participants, exclusions);
});

Deno.test("Minimum group of 2 participants", () => {
  // A->B and B->A would violate non-reciprocity. No valid derangement possible.
  const participants = makeParticipants(["A", "B"]);
  const result = smartDraw(participants, []);
  // With 2 people, the only derangement is A->B, B->A which is reciprocal — should be null.
  assertEquals(result, null, "2 participants always produce a reciprocal pair — impossible");
});

Deno.test("3 participants, no exclusions — finds valid derangement", () => {
  const participants = makeParticipants(["A", "B", "C"]);
  const result = smartDraw(participants, []);
  assertNotEquals(result, null, "Should find a valid assignment with 3 people");
  validateDerangement(result!, participants, []);
});

Deno.test("Impossible scenario: too many exclusions", () => {
  // 4 participants where exclusions make it truly impossible
  const participants = makeParticipants(["A", "B", "C", "D"]);
  // Everyone is excluded from everyone else — impossible
  const exclusions: Exclusion[] = [
    { usuario_a_id: "A", usuario_b_id: "B" },
    { usuario_a_id: "A", usuario_b_id: "C" },
    { usuario_a_id: "A", usuario_b_id: "D" },
    { usuario_a_id: "B", usuario_b_id: "C" },
    { usuario_a_id: "B", usuario_b_id: "D" },
    { usuario_a_id: "C", usuario_b_id: "D" },
  ];

  const result = smartDraw(participants, exclusions);
  assertEquals(result, null, "Should return null when draw is impossible");
});

Deno.test("Non-reciprocity is enforced without explicit exclusion", () => {
  // 4 people: ensure A->B means B cannot draw A (even without explicit exclusion)
  const participants = makeParticipants(["A", "B", "C", "D"]);
  const result = smartDraw(participants, []);
  assertNotEquals(result, null, "Should find a valid assignment");

  // Check non-reciprocity for ALL pairs
  for (const [giver, receiver] of result!) {
    assertNotEquals(
      result!.get(receiver),
      giver,
      `Reciprocal pair found: ${giver} <-> ${receiver}`,
    );
  }
});

Deno.test("6 participants, 2 exclusion pairs", () => {
  const participants = makeParticipants(["A", "B", "C", "D", "E", "F"]);
  const exclusions: Exclusion[] = [
    { usuario_a_id: "A", usuario_b_id: "B" }, // A and B can't be paired
    { usuario_a_id: "C", usuario_b_id: "D" }, // C and D can't be paired
  ];

  const result = smartDraw(participants, exclusions);
  assertNotEquals(result, null, "Should find a valid assignment for 6 people");
  validateDerangement(result!, participants, exclusions);
});

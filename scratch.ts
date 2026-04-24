interface Participant {
  id: string;
  user_id: string;
}

interface Exclusion {
  user_a_id: string;
  user_b_id: string;
}

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
    if (giver === receiver) return false;
    if (receiverUsed.has(receiver)) return false;
    if (forbidden.has(`${giver}->${receiver}`)) return false;
    if (assignment.get(receiver) === giver) return false;
    return true;
  }

  function backtrack(index: number): boolean {
    if (index === ids.length) return true;

    const giver = ids[index];
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

const res = smartDraw([
  { id: '1', user_id: 'A' },
  { id: '2', user_id: 'B' },
  { id: '3', user_id: 'C' }
], []);

console.log(res);

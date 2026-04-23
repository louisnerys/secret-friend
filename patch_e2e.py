import sys

with open("tests/e2e.ts", "r") as f:
    content = f.read()

# Instead of checking insert status as an error, we should expect 409 Conflict because the database trigger already inserted it.
# We will just verify the user exists using a SELECT.

content = content.replace("""const insertU1 = await rest("POST", "/rest/v1/users",
  { id: user1Id, email: email1, nome: "User Test 1" },
  { Authorization: `Bearer ${user1Token}` }
);
if (insertU1.status === 201 || insertU1.status === 200) {
  ok("User 1 inserido na tabela users");
} else {
  fail("INSERT users user1", `Status ${insertU1.status}: ${JSON.stringify(insertU1.data)}`);
}

const insertU2 = await rest("POST", "/rest/v1/users",
  { id: user2Id, email: email2, nome: "User Test 2" },
  { Authorization: `Bearer ${user2Token}` }
);
if (insertU2.status === 201 || insertU2.status === 200) {
  ok("User 2 inserido na tabela users");
} else {
  fail("INSERT users user2", `Status ${insertU2.status}: ${JSON.stringify(insertU2.data)}`);
}

const insertU3 = await rest("POST", "/rest/v1/users",
  { id: user3Id, email: email3, nome: "User Test 3" },
  { Authorization: `Bearer ${user3Token}` }
);
if (insertU3.status === 201 || insertU3.status === 200) {
  ok("User 3 inserido na tabela users");
} else {
  fail("INSERT users user3", `Status ${insertU3.status}: ${JSON.stringify(insertU3.data)}`);
}""", """// Verificando se os usuários foram inseridos pelo trigger
const selectU1 = await rest("GET", `/rest/v1/users?id=eq.${user1Id}`, undefined, { Authorization: `Bearer ${user1Token}` });
if (selectU1.status === 200 && selectU1.data && selectU1.data.length === 1) {
  ok("User 1 inserido na tabela users automaticamente (trigger)");
} else {
  fail("Verifica users user1", `Status ${selectU1.status}: ${JSON.stringify(selectU1.data)}`);
}

const selectU2 = await rest("GET", `/rest/v1/users?id=eq.${user2Id}`, undefined, { Authorization: `Bearer ${user2Token}` });
if (selectU2.status === 200 && selectU2.data && selectU2.data.length === 1) {
  ok("User 2 inserido na tabela users automaticamente (trigger)");
} else {
  fail("Verifica users user2", `Status ${selectU2.status}: ${JSON.stringify(selectU2.data)}`);
}

const selectU3 = await rest("GET", `/rest/v1/users?id=eq.${user3Id}`, undefined, { Authorization: `Bearer ${user3Token}` });
if (selectU3.status === 200 && selectU3.data && selectU3.data.length === 1) {
  ok("User 3 inserido na tabela users automaticamente (trigger)");
} else {
  fail("Verifica users user3", `Status ${selectU3.status}: ${JSON.stringify(selectU3.data)}`);
}""")

with open("tests/e2e.ts", "w") as f:
    f.write(content)

print("Tests patched!")

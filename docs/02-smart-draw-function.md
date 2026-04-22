Objetivo: Implementar o algoritmo de sorteio inteligente (Smart Draw) em uma Edge Function.

# Passo 2: Algoritmo de Sorteio Smart Draw

## Contexto
O sorteio é um desarranjo matemático ($f(i) \neq i$) com restrições adicionais [10].

## Tarefas do Agente
1. Criar uma Supabase Edge Function em TypeScript: `perform-draw`.
2. Implementar a lógica:
    - Autenticar o criador do evento via JWT.
    - Buscar participantes e exclusões usando `service_role` para bypassar RLS [7, 11].
    - Algoritmo de Backtracking para resolver o emparelhamento bipartido [8].
    - **Regra de Não-Reciprocidade:** Se A tira B, B não pode tirar A.
    - Atualizar a tabela `participantes` com os `sorteado_id`.
    - Mudar status do evento para 'sorteado'.

## Testes Unitários
- Simular grupo de 4 pessoas com 1 par de exclusão. O sistema deve retornar o único resultado possível.
- Simular cenário impossível (muitas exclusões) e garantir que a função retorne um erro amigável ao moderador [12].

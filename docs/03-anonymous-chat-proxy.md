Objetivo: Criar o proxy de mensagens para garantir o anonimato total do doador.

# Passo 3: Proxy de Chat Anônimo

## Contexto
O sorteado pode responder ao seu Amigo Secreto sem saber quem ele é [14].

## Tarefas do Agente
1. Criar Edge Function `get-anonymous-messages` que atua como proxy reverso [13, 15].
2. Lógica de Higienização:
    - Receber o `evento_id`.
    - Consultar `mensagens_privadas`.
    - Iterar pelas mensagens: Se `remetente_id != auth.uid()`, substituir o valor por uma string fixa "Seu Amigo Secreto" [16].
    - Remover campos de UUID reais do remetente do objeto JSON final [17].

## Garantia de Qualidade
- Inspecionar a resposta HTTP da API e confirmar que o ID real do doador não vaza nos metadados ou headers [18, 19].

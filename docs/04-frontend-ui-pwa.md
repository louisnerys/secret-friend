Objetivo: Desenvolver a interface Next.js com foco em performance percebida e uso mobile.

# Passo 4: Frontend Next.js e PWA

## Context
Interface mobile-first com animações de revelação e feedback instantâneo [22, 23].

## Tarefas do Agente
1. Estruturar as rotas: `/login`, `/dashboard`, `/event/[id]`, `/event/[id]/sorteio`.
2. Implementar **Optimistic UI** [24, 25]:
    - Reações de messages (curtidas) devem mudar de cor no clique, antes da confirmação do banco [26, 27].
    - Novas messages devem aparecer instantaneamente na lista.
3. Configurar **PWA**: manifest.json e Service Worker para cache-first em ativos estáticos [28, 29].
4. Implementar **Skeleton Screens** no carregamento das listas de events [30].

## Testes de Interface
- Testar comportamento offline: o usuário deve conseguir ler messages salvas no cache do Service Worker [31, 32].

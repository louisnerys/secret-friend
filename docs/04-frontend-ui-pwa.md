Objetivo: Desenvolver a interface Next.js com foco em performance percebida e uso mobile.

# Passo 4: Frontend Next.js e PWA

## Contexto
Interface mobile-first com animações de revelação e feedback instantâneo [22, 23].

## Tarefas do Agente
1. Estruturar as rotas: `/login`, `/dashboard`, `/evento/[id]`, `/evento/[id]/sorteio`.
2. Implementar **Optimistic UI** [24, 25]:
    - Reações de mensagens (curtidas) devem mudar de cor no clique, antes da confirmação do banco [26, 27].
    - Novas mensagens devem aparecer instantaneamente na lista.
3. Configurar **PWA**: manifest.json e Service Worker para cache-first em ativos estáticos [28, 29].
4. Implementar **Skeleton Screens** no carregamento das listas de eventos [30].

## Testes de Interface
- Testar comportamento offline: o usuário deve conseguir ler mensagens salvas no cache do Service Worker [31, 32].

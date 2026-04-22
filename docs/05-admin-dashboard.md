Objetivo: Criar o painel administrativo solicitado para monitoramento global.

# Passo 5: Dashboard Administrativo Global

## Context
Métricas de engajamento e saúde da plataforma [34].

## Tarefas do Agente
1. Criar tela `/admin` acessível apenas para usuários com role 'admin' no Supabase Auth.
2. Implementar consultas agregadas:
    - Total de usuários ativos (MAU) [35].
    - Events agrupados por status (Aberto/Finalizado).
    - **Taxa de Engajamento:** (Participantes com lista de desejos preenchida / Total de participants).
    - Volume de messages trafegadas nas últimas 24h.

## Garantia de Qualidade
- Garantir que nenhum dado sensível de sorteio (quem tirou quem) seja carregado nesta tela, mesmo para o administrador [36].

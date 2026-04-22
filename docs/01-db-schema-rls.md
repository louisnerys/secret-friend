Objetivo: Configurar o banco de dados PostgreSQL e as políticas de segurança de nível de linha (RLS).

# Passo 1: Schema de Banco de Dados e Segurança RLS

## Context
O banco deve gerenciar usuários, events, sorteios e chats, garantindo o segredo absoluto através do hardware (banco de dados) [3].

## Tarefas do Agente
1. Criar as seguintes tabelas no esquema `public`:
    - `users`: id (uuid, primary key), email, nome, avatar_url.
    - `events`: id (uuid), creator_id (referencia users), nome, reveal_date, description, status (enum: 'open', 'drawn', 'finished').
    - `participants`: id, event_id, user_id, wishlist (text), drawn_id (uuid, secreto).
    - `exclusions`: id, event_id, user_a_id, user_b_id.
    - `messages`: id, event_id, sender_id, text, criado_em, reactions (jsonb).
    - `private_messages`: id, event_id, sender_id, recipient_id, text, criado_em.

2. Configurar **Row Level Security (RLS)** [2, 4]:
    - Habilitar RLS em todas as tabelas.
    - Política para `participants`: O usuário autenticado só pode ver seu próprio `drawn_id` [5].
    - Política para `exclusions`: Apenas o `creator_id` do event pode inserir/deletar.
    - Política para `private_messages`: SELECT permitido apenas se `auth.uid()` for o remetente ou o destinatário.

## Testes Obrigatórios
- Executar teste de "ataque": Tentar consultar a coluna `drawn_id` de outro usuário logado e garantir que retorne vazio ou erro [6].
- Verificar se `service_role` consegue ignorar o RLS para o sorteio [7].

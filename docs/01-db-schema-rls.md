Objetivo: Configurar o banco de dados PostgreSQL e as políticas de segurança de nível de linha (RLS).

# Passo 1: Schema de Banco de Dados e Segurança RLS

## Contexto
O banco deve gerenciar usuários, eventos, sorteios e chats, garantindo o segredo absoluto através do hardware (banco de dados) [3].

## Tarefas do Agente
1. Criar as seguintes tabelas no esquema `public`:
    - `usuarios`: id (uuid, primary key), email, nome, avatar_url.
    - `eventos`: id (uuid), criador_id (referencia usuarios), nome, data_revelacao, descricao, status (enum: 'aberto', 'sorteado', 'finalizado').
    - `participantes`: id, evento_id, usuario_id, lista_desejos (text), sorteado_id (uuid, secreto).
    - `exclusoes`: id, evento_id, usuario_a_id, usuario_b_id.
    - `mensagens`: id, evento_id, remetente_id, texto, criado_em, reactions (jsonb).
    - `mensagens_privadas`: id, evento_id, remetente_id, destinatario_id, texto, criado_em.

2. Configurar **Row Level Security (RLS)** [2, 4]:
    - Habilitar RLS em todas as tabelas.
    - Política para `participantes`: O usuário autenticado só pode ver seu próprio `sorteado_id` [5].
    - Política para `exclusoes`: Apenas o `criador_id` do evento pode inserir/deletar.
    - Política para `mensagens_privadas`: SELECT permitido apenas se `auth.uid()` for o remetente ou o destinatário.

## Testes Obrigatórios
- Executar teste de "ataque": Tentar consultar a coluna `sorteado_id` de outro usuário logado e garantir que retorne vazio ou erro [6].
- Verificar se `service_role` consegue ignorar o RLS para o sorteio [7].

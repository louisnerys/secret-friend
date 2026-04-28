1. **Nova Migration do Banco de Dados (`supabase/migrations/xxxx_add_wishlist_items.sql`)**
   - Criar tabela `wishlist_items`: `id` uuid, `participant_id` uuid fk `participants(id)` cascade, `item` text, `created_at` timestamp.
   - RLS de `wishlist_items`:
     - Select: participantes do evento (`exists (select 1 from public.participants p1 join public.participants p2 on p1.event_id = p2.event_id where p1.id = wishlist_items.participant_id and p2.user_id = auth.uid())`).
     - Insert/Update/Delete: `exists (select 1 from public.participants p where p.id = wishlist_items.participant_id and p.user_id = auth.uid())`.
   - Adicionar uma constraint de foreign key na view ou expor os dados. Mas como views não têm FKs nativas pro PostgREST fazer joins via `vw_participants`, precisaremos buscar a `wishlist_items` via `participants` ou manualmente no frontend.
     Para simplificar o backend e garantir segurança, podemos buscar as listas no frontend passando os `participant_ids`.
   - Atualizar a função `get_admin_metrics()` para contar participantes em `wishlist_items`.
   - Script para migrar dados de `participants.wishlist` (separado por newline) para `wishlist_items`.

2. **Frontend Tipos e Constantes**
   - Em `frontend/src/lib/types.ts`: Adicionar `WishlistItem { id: string; participant_id: string; item: string; }`
   - Config em `.env`: `NEXT_PUBLIC_WISHLIST_MAX_ITEMS=5`. Ligar no frontend.

3. **Frontend UI (`frontend/src/app/evento/[id]/page.tsx`)**
   - Buscar as wishlists. Como o frontend já usa `vw_participants` para pegar os participantes, depois disso buscar os itens da wishlist: `const { data: wlItems } = await supabase.from('wishlist_items').select('*').in('participant_id', parts.map(p => p.id));`
   - Agrupar e colocar dentro do state de participantes (ex: `p.wishlist_items = wlItems.filter(...)`).
   - Remover os campos de texto atuais e substituir por:
     - Lista de itens atuais (com botão de excluir).
     - Input texto + botão Adicionar (limitando pelo max config).
   - O sorteado (drawnPerson) deve mostrar a lista dos itens em marcadores (`<li>`).

4. **Traduções (`frontend/src/locales/*`)**
   - Traduzir botão de adicionar, exclusão e mensagens de limite.

5. **Testes & Pré-commit**
   - Executar verificações de linting/testes.

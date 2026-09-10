# Banco Supabase e segurança

O arquivo [supabase/schema.sql](supabase/schema.sql) é idempotente: pode inicializar um projeto novo e também atualiza a estrutura legada sem apagar registros.

Para um projeto que já executou uma versão anterior do schema, execute também uma vez [202609100001_credit_cards_canonical.sql](supabase/migrations/202609100001_credit_cards_canonical.sql). A migration não remove tabelas, cartões ou transações; ela sincroniza o legado `"limit"`, recalcula `used` a partir das transações existentes e preserva `credit_limit` como campo oficial.

## Tabelas usadas

| Tabela | Finalidade | Proteção |
| --- | --- | --- |
| `transactions` | Entradas e despesas, inclusive compras no cartão | RLS por `auth.uid() = user_id` |
| `credit_cards` | Limite, fechamento, vencimento e identificação do cartão | RLS por `auth.uid() = user_id` |
| `goals` | Valor alvo, progresso, prazo e descrição | RLS por `auth.uid() = user_id` |

## Decisões de schema

- `credit_limit` é o limite oficial. `"limit"` é sincronizado pelo trigger somente para compatibilidade; `used` é recalculado a partir das transações vinculadas e não é fonte de verdade da interface.
- A fatura é derivada de `transactions` ligadas a `credit_card_id`; cada transação só pode referenciar cartão do mesmo proprietário.
- Ao excluir cartão, o FK usa `ON DELETE SET NULL` para não destruir o histórico. A interface bloqueia a exclusão enquanto há compras vinculadas, preservando a integridade visual.
- Índices por usuário/data e por cartão/data evitam leituras desnecessárias.
- Os gatilhos definem `user_id` em `INSERT` com `auth.uid()` e impedem mudança de proprietário em `UPDATE`.

## RLS

As três políticas usam `FOR ALL` com `USING` e `WITH CHECK`. Assim, seleção, inserção, atualização e remoção só são permitidas ao dono autenticado. O SQL remove políticas preexistentes somente dessas três tabelas para evitar uma regra permissiva residual.

## Dados legados

O script não adivinha o dono de um registro antigo com `user_id` nulo. RLS o deixa invisível. Antes de tornar a coluna `NOT NULL` em uma base já existente, associe cada registro ao usuário correto usando uma operação administrativa controlada no SQL Editor.

# Finanças Matheus

Sistema financeiro pessoal multiusuário para registrar movimentações, acompanhar cartões de crédito, metas e relatórios com dados reais. O frontend é Next.js, a autenticação e persistência usam Supabase, e a produção usa Vercel.

## Stack

- Next.js 16, React 19 e TypeScript
- Supabase Auth, PostgreSQL e Row Level Security (RLS)
- CSS próprio e Lucide React

## Executar localmente

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env.local` e informe a URL e a Publishable Key do Supabase.
3. Execute todo o arquivo [supabase/schema.sql](supabase/schema.sql) no SQL Editor do Supabase. Ele é idempotente e preserva registros existentes.
4. Se o projeto Supabase já usava a versão anterior do schema, execute uma vez [a migration de cartões](supabase/migrations/202609100001_credit_cards_canonical.sql).
5. Inicie com `npm run dev` e acesse `http://localhost:3000`.

As únicas variáveis necessárias são:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Comandos de qualidade

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Regras financeiras

- Valores são gravados como `numeric(12,2)` no PostgreSQL e calculados no cliente em centavos para evitar imprecisão de ponto flutuante.
- O saldo mensal é entradas menos despesas no período selecionado.
- Uma despesa vinculada a cartão integra a fatura. A fatura atual inclui compras entre o dia posterior ao último fechamento e o próximo fechamento.
- `credit_cards.credit_limit` é a fonte de verdade para limite. As colunas legadas `limit` e `used` são mantidas apenas por compatibilidade; a interface não depende delas.
- O progresso da meta é um valor explícito do usuário e pode ser ajustado sem criar movimentações duplicadas.

## Segurança

O schema habilita RLS em todas as tabelas financeiras. Triggers definem `user_id` usando o JWT autenticado, por isso o cliente não envia nem escolhe o proprietário de registros. Nunca use uma `service_role` key no navegador.

Se houver um registro legado com `user_id` nulo, ele não ficará acessível com RLS. Associe-o ao usuário correto diretamente pelo SQL Editor antes de exigir `NOT NULL` na coluna.

Para instruções completas de produção na Vercel, veja [DEPLOY.md](DEPLOY.md).

## Produção na Vercel

A Vercel detecta automaticamente Next.js e executa `npm run build`; não é necessário `vercel.json`, Nginx, PM2 ou exportação estática. O guia de importação do GitHub, variáveis, domínio e Supabase está em [DEPLOY.md](DEPLOY.md). Consulte também [CHECKLIST-PRODUCAO.md](CHECKLIST-PRODUCAO.md) antes de publicar.

## Estrutura

```text
app/                 rotas do Next.js
components/          interface e formulários
lib/                 Supabase e regras financeiras
types/               tipos TypeScript
supabase/schema.sql  criação/migração idempotente do banco
```

Detalhes de tabelas, RLS, índices, triggers e compatibilidade legada estão em [SCHEMA-SUPABASE.md](SCHEMA-SUPABASE.md).

O fluxo de confirmação, recuperação de senha, callback, URLs de redirect e SMTP está documentado em [AUTH-SUPABASE.md](AUTH-SUPABASE.md).

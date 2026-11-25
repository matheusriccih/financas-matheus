# Finanças Matheus

Sistema de gestão financeira pessoal **multiusuário**: cada pessoa cria a própria conta e vê apenas os próprios dados. Permite registrar entradas e despesas, acompanhar faturas de cartão de crédito, definir metas e ver relatórios mensais.

**Demo:** [financas-matheus-six.vercel.app](https://financas-matheus-six.vercel.app) (crie uma conta para testar)

## Funcionalidades

- Cadastro, login, confirmação de e-mail e recuperação de senha (Supabase Auth)
- Visão geral com saldo, entradas, despesas e taxa de economia do mês
- Movimentações com categorias, busca e filtro por período
- Cartões de crédito com cálculo da fatura atual pelo dia de fechamento e limite disponível
- Metas com acompanhamento de progresso
- Relatórios com evolução dos últimos 6 meses e despesas por categoria

## Destaques técnicos

- **Isolamento de dados com Row Level Security (RLS):** o banco só devolve os registros do usuário autenticado, e o `user_id` é definido por trigger a partir do JWT, não pelo navegador.
- **Valores em centavos:** os cálculos são feitos em inteiros para evitar erro de arredondamento de ponto flutuante.
- **Schema idempotente e versionado:** [supabase/schema.sql](supabase/schema.sql) pode ser executado mais de uma vez sem perder dados, com migration separada para mudanças.
- **Deploy contínuo na Vercel** a partir da branch principal.

## Stack

- Next.js 16 (App Router), React 19 e TypeScript
- Supabase: Auth, PostgreSQL e RLS
- CSS próprio e ícones Lucide React
- Hospedagem na Vercel

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

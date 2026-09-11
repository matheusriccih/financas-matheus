# Deploy na Vercel

O Finanças Matheus é um projeto Next.js compatível com deploy direto pela Vercel. Não requer `vercel.json`, PM2, Nginx, VPS ou exportação estática.

## Pré-requisitos

- Repositório GitHub atualizado na branch `main`.
- Projeto Supabase existente com o schema já aplicado.
- Node.js 20.9 ou superior para desenvolvimento local.

## 1. GitHub

Confirme que `.env.local`, `.env`, `.next`, `node_modules` e `.vercel` não estão versionados. Publique as alterações normais na branch `main`; não envie credenciais.

## 2. Importar na Vercel

1. Abra o painel Vercel e escolha **Add New → Project**.
2. Importe `matheusriccih/financas-matheus` e selecione a branch `main`.
3. Mantenha o preset **Next.js**. A Vercel detecta instalação e build automaticamente.
4. Em **Environment Variables**, cadastre para o ambiente **Production**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   NEXT_PUBLIC_SITE_URL=https://seu-dominio-real.com.br
   ```

   Use valores do seu painel Supabase. A Publishable Key é apropriada para o navegador; nunca cadastre service role, secret key, token administrativo ou senha no projeto.

5. Clique em **Deploy**. Depois de alterar qualquer variável `NEXT_PUBLIC_*`, faça um novo deploy: elas são incorporadas durante o build.

## 3. Domínio

1. Em **Project → Settings → Domains**, adicione seu domínio real.
2. A Vercel mostrará os registros DNS exigidos. Copie exatamente os valores exibidos no painel para o provedor do domínio; não use valores genéricos deste documento.
3. Aguarde a validação. A Vercel emite e renova HTTPS automaticamente.
4. Escolha um domínio canônico e defina-o em `NEXT_PUBLIC_SITE_URL`, depois faça redeploy.

## 4. Supabase Auth

No painel Supabase, em **Authentication → URL Configuration**:

1. Configure **Site URL** com o domínio HTTPS canônico da Vercel.
2. Adicione Redirect URLs:

   ```text
   http://localhost:3000/auth/callback
   https://seu-dominio-real.com.br/auth/callback
   ```

3. Para ambientes Preview, adicione somente URLs de preview que você realmente for usar e mantenha a URL canônica de produção em `NEXT_PUBLIC_SITE_URL` no ambiente Production.
4. Configure SMTP próprio para confirmação e recuperação de senha. O passo a passo está em [AUTH-SUPABASE.md](AUTH-SUPABASE.md).

## 5. Banco de dados

Não recrie nem apague tabelas. Se o Supabase já recebeu uma versão anterior do schema, execute uma vez no SQL Editor a migration não destrutiva:

[supabase/migrations/202609100001_credit_cards_canonical.sql](supabase/migrations/202609100001_credit_cards_canonical.sql)

Ela mantém `credit_limit` como campo oficial, sincroniza o legado `"limit"` e recalcula `used` pelas transações existentes.

## 6. Verificação pós-deploy

1. Abra a URL da Vercel e crie uma conta.
2. Confirme o e-mail e valide o retorno a `/dashboard`.
3. Teste login, logout e recuperação de senha.
4. Teste CRUD de movimentações, cartões e metas.
5. Confirme com um segundo usuário que RLS não expõe dados de outro usuário.

O checklist completo está em [CHECKLIST-PRODUCAO.md](CHECKLIST-PRODUCAO.md).

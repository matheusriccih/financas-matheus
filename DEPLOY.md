# Deploy em produção — Finanças Matheus

## Decisão de arquitetura

Este projeto usa Next.js com middleware de sessão e rotas protegidas. Portanto, ele exige hospedagem com **Node.js persistente** para executar `next start`. Hospedagem compartilhada que aceita somente arquivos estáticos/PHP não é compatível com esta versão. Não use `next export`: isso removeria o middleware de autenticação e não é uma alternativa equivalente.

Na HostGator, use um plano VPS/Cloud ou um plano Node.js que permita executar processos Node, configurar variáveis de ambiente e fazer proxy reverso. Caso o plano atual seja compartilhado sem Node.js, a opção correta é migrar este app para VPS/Cloud ou usar uma plataforma Node compatível.

## Preparar Supabase

1. Em **Authentication → URL Configuration**, inclua a URL de produção em `Site URL` e nas URLs de redirecionamento.
2. Rode [supabase/schema.sql](supabase/schema.sql) uma única vez no SQL Editor.
3. Confirme em **Database → Policies** que `transactions`, `credit_cards` e `goals` têm RLS ativado e somente as políticas `own …` criadas pelo script.
4. Nunca copie a `service_role` key para a aplicação ou painel de hospedagem público.

## Publicar em um ambiente Node.js

1. Suba o código pelo Git ou SFTP, sem arquivos `.env*`.
2. No painel da HostGator/VPS, configure:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   NEXT_PUBLIC_SITE_URL=https://financas.exemplo.com
   NODE_ENV=production
   ```

3. Execute no diretório do projeto:

   ```bash
   npm ci
   npm run build
   npm run start
   ```

4. Mantenha o processo vivo com o gerenciador oferecido pelo plano (ou systemd/PM2 em VPS). Aponte o proxy reverso para a porta do processo, normalmente `3000`.
5. Aponte o DNS do domínio ao IP/host indicado pela HostGator e habilite SSL. Redirecione HTTP para HTTPS.

## Checklist pós-deploy

- Abra `/auth/signup`, confirme e-mail se estiver habilitado e faça login.
- Verifique que uma sessão anônima é redirecionada ao abrir `/dashboard`.
- Crie uma movimentação, cartão e meta; recarregue a página para confirmar persistência.
- Teste com um segundo usuário: nenhum registro do primeiro usuário deve aparecer.
- Revise os logs do servidor, sem expor chaves ou dados financeiros.

## Problemas comuns

- **"A configuração do Supabase não está disponível"**: confira as duas variáveis e reinicie o processo após alterá-las.
- **Falha ao inserir dados**: execute novamente o schema idempotente e confirme que o usuário está autenticado.
- **Loop de login**: confira URL/Publishable Key, URLs de redirecionamento do Supabase, cookies HTTPS e relógio do servidor.
- **Página 502/503**: o processo Node não está ativo ou o proxy aponta para a porta errada.

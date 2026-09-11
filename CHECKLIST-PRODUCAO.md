# Checklist de publicação

## Antes do deploy

- [ ] Variáveis de produção cadastradas somente no painel da Vercel com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Nenhuma chave `service_role`, secret, senha ou token foi enviada ao Git.
- [ ] [supabase/schema.sql](supabase/schema.sql) executado com sucesso no Supabase.
- [ ] A migration de cartões foi executada caso o schema já existisse antes desta versão.
- [ ] RLS ativo em `transactions`, `credit_cards` e `goals`.
- [ ] Registros legados com `user_id` nulo foram associados manualmente ao proprietário correto ou mantidos inacessíveis.
- [ ] `npm ci`, `npm run lint`, `npx tsc --noEmit` e `npm run build` passaram na versão a publicar.

## Vercel e domínio

- [ ] Repositório GitHub foi importado na Vercel pela branch `main`.
- [ ] As três variáveis `NEXT_PUBLIC_*` foram cadastradas em Production.
- [ ] O build e deploy da Vercel concluíram sem erros.
- [ ] O domínio foi adicionado em Settings → Domains e os registros DNS indicados pela Vercel foram configurados.
- [ ] HTTPS automático da Vercel está ativo.
- [ ] URL final está configurada no Supabase Auth.
- [ ] `NEXT_PUBLIC_SITE_URL` usa a mesma URL HTTPS canônica.
- [ ] SMTP personalizado, SPF e DKIM foram configurados no painel do Supabase.

## Teste de aceitação

- [ ] Cadastro, confirmação de e-mail (quando ativa), login e logout funcionam.
- [ ] Reenvio de confirmação e recuperação/atualização de senha funcionam.
- [ ] Sessão anônima é redirecionada de qualquer rota privada ao login.
- [ ] Usuário A não vê/cria/edita/exclui registros do usuário B.
- [ ] Movimentação de cartão integra fatura, limite disponível e relatório.
- [ ] Meta, cartões e movimentações persistem após recarregar a página.
- [ ] Interface é navegável no celular e desktop.
- [ ] Não há erros sensíveis no console do navegador, nos logs de Functions ou no deployment da Vercel.

## Roteiro funcional completo

- [ ] 1. Criar uma conta com endereço de e-mail válido.
- [ ] 2. Confirmar que a tela informa a necessidade de confirmar o e-mail.
- [ ] 3. Receber e abrir o e-mail de confirmação; validar retorno ao dashboard.
- [ ] 4. Testar “Reenviar e-mail de confirmação”, inclusive após aguardar o limite de envio quando aplicável.
- [ ] 5. Fazer login, sair e fazer login novamente.
- [ ] 6. Sem sessão, abrir `/dashboard`, `/movimentacoes`, `/cartoes`, `/metas`, `/relatorios` e `/configuracoes`; todas devem redirecionar ao login.
- [ ] 7. Criar uma entrada e uma despesa.
- [ ] 8. Editar e excluir uma transação.
- [ ] 9. Criar cartão, vincular despesa e validar fatura/limite disponível.
- [ ] 10. Tentar excluir cartão com compra vinculada; a interface deve bloquear a ação.
- [ ] 11. Criar, editar, ajustar e excluir uma meta.
- [ ] 12. Solicitar recuperação de senha, abrir o link, definir nova senha e entrar com ela.
- [ ] 13. Com usuário B, conferir que nenhum registro de A aparece, pode ser alterado ou removido para transações, cartões e metas.

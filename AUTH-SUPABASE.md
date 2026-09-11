# Autenticação e e-mail do Supabase

## Fluxos implementados

- Cadastro com `signUp`, perfil de nome e callback seguro.
- Confirmação de e-mail e botão para reenvio com bloqueio durante o envio.
- Login e logout.
- Recuperação de senha, callback, nova senha e encerramento da sessão após a alteração.
- Callback em `/auth/callback`, que troca o código do Supabase por cookies de sessão sem expor token na URL.

O app usa `NEXT_PUBLIC_SITE_URL` apenas para compor URLs públicas de callback. Em desenvolvimento, use `http://localhost:3000`; na Vercel, use exatamente a URL HTTPS canônica, sem barra final, no ambiente Production.

## Configuração manual no painel Supabase

Em **Authentication → URL Configuration**:

1. Defina Site URL como `https://seu-dominio.com.br`.
2. Adicione as Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://seu-dominio.com.br/auth/callback`
3. Mantenha confirmação de e-mail habilitada se quiser exigir ativação antes do primeiro login.

Em **Authentication → Email Templates**, ajuste os textos de confirmação e recuperação para mencionar “Finanças Matheus”. Os links dos templates precisam usar `{{ .ConfirmationURL }}` e `{{ .TokenHash }}` conforme o template padrão do Supabase; não cole tokens ou URLs privadas no código.

## SMTP para produção

O serviço de e-mail padrão do Supabase possui limites e não deve ser a única opção de produção. Em **Authentication → SMTP Settings**, habilite SMTP personalizado e preencha, com dados do seu provedor:

- Host SMTP e porta (normalmente 465 ou 587);
- Usuário SMTP e senha/app password;
- Nome e e-mail do remetente;
- Domínio de envio.

Configure SPF e DKIM no DNS conforme o provedor SMTP, e adicione DMARC quando possível. Essas credenciais pertencem somente ao painel do Supabase; nunca entram em `.env`, navegador, repositório ou Vercel.

## Teste manual de e-mail

1. Crie uma conta e confirme que a tela informa a necessidade de ativação.
2. Receba o link, abra-o e confirme o redirecionamento a `/dashboard`.
3. Teste “Reenviar e-mail de confirmação”, incluindo o cenário de limite de envio.
4. Solicite recuperação, abra o link e defina uma nova senha.
5. Verifique spam e os logs do provedor SMTP se a mensagem não chegar.

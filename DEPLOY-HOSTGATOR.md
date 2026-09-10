# Produção na VPS HostGator

Este projeto requer VPS com Linux, Node.js e proxy reverso. Não publique os arquivos em `public_html` nem use exportação estática: as rotas privadas dependem do Proxy do Next.js e de sessão Supabase.

Os exemplos abaixo usam Ubuntu, domínio `financas.exemplo.com` e o usuário não-root `deploy`. Troque-os pelos valores reais.

## 1. Preparar o servidor

Conecte-se por SSH como root, atualize o sistema e crie um usuário para o app:

```bash
apt update && apt upgrade -y
apt install -y nginx git curl ufw
adduser deploy
usermod -aG sudo deploy
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Instale uma versão LTS atual do Node.js (confira a versão suportada pelo Next.js antes de usar uma versão diferente):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version
npm --version
npm install -g pm2
```

## 2. Subir o projeto e configurar ambiente

Entre como `deploy` e use uma pasta fora de diretórios públicos:

```bash
sudo -iu deploy
mkdir -p /var/www/financas-matheus
cd /var/www/financas-matheus
git clone SEU_REPOSITORIO.git current
cd current
npm ci
```

Crie `.env.production` no servidor. Ele não deve ir ao Git e deve ser legível apenas pelo usuário do processo:

```bash
umask 077
nano .env.production
```

Conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave
NEXT_PUBLIC_SITE_URL=https://financas.exemplo.com
```

```bash
chmod 600 .env.production
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
curl -I http://127.0.0.1:3000
```

Para restaurar o processo após reinicialização, execute como `deploy`:

```bash
pm2 startup systemd -u deploy --hp /home/deploy
```

O PM2 exibirá um comando `sudo …`; execute exatamente esse comando uma vez e depois rode `pm2 save` novamente como `deploy`.

## 3. Configurar Nginx e domínio

Como root, crie `/etc/nginx/sites-available/financas-matheus`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name financas.exemplo.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Ative e valide:

```bash
ln -s /etc/nginx/sites-available/financas-matheus /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

No provedor de DNS, crie um registro `A` de `financas` (ou `@`) apontando para o IPv4 público da VPS. Se criar um `AAAA`, ele deve apontar para um IPv6 funcional; caso contrário, não o crie. Aguarde a propagação antes do certificado:

```bash
dig +short financas.exemplo.com A
```

## 4. HTTPS

Com o DNS já apontando e portas 80/443 liberadas:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d financas.exemplo.com --redirect --agree-tos -m seu-email@exemplo.com
systemctl status certbot.timer
```

O Certbot altera o Nginx para redirecionar HTTP a HTTPS e renova automaticamente. Após confirmar que todo o domínio usa HTTPS, adicione HSTS no bloco HTTPS do Nginx se desejar:

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
```

## 5. Configurar Supabase

1. Rode [supabase/schema.sql](supabase/schema.sql) no SQL Editor do projeto Supabase.
2. Se o schema já foi executado antes desta versão, rode uma vez [202609100001_credit_cards_canonical.sql](supabase/migrations/202609100001_credit_cards_canonical.sql).
3. Em **Authentication → URL Configuration**, defina `https://financas.exemplo.com` como Site URL e adicione-a às Redirect URLs.
4. Defina `NEXT_PUBLIC_SITE_URL=https://financas.exemplo.com` no `.env.production` para callbacks de confirmação e recuperação de senha.
5. Configure SMTP personalizado no painel Supabase antes de produção; detalhes em [AUTH-SUPABASE.md](AUTH-SUPABASE.md).
6. Use somente a URL e Publishable Key no servidor. Nunca use `service_role`, secret key, senha ou token privado no frontend/repositório.
4. Teste com dois usuários diferentes: nenhuma tabela financeira deve exibir registros do outro usuário.

## 6. Operação diária

```bash
# status e logs
pm2 status
pm2 logs financas-matheus --lines 100
pm2 monit

# atualização normal (como deploy)
cd /var/www/financas-matheus/current
git fetch --all --prune
git checkout BRANCH_DE_PRODUCAO
git pull --ff-only
npm ci
npm run lint
npx tsc --noEmit
npm run build
pm2 reload financas-matheus --update-env

# rollback para o commit anterior
git log --oneline -5
git checkout COMMIT_ANTERIOR
npm ci
npm run build
pm2 reload financas-matheus --update-env
```

Faça backup antes de upgrades relevantes: mantenha o repositório remoto, faça export/backups do banco pelo Supabase e salve uma cópia criptografada do `.env.production` fora da VPS. Não inclua a chave em logs ou tickets.

Para atualizar dependências, faça isso em uma branch/teste, rode lint, TypeScript e build, revise `npm audit`, publique uma versão testada e só então execute o processo de atualização acima.

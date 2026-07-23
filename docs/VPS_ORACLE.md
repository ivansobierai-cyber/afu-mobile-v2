# VPS Oracle — acesso e deploy AFU

**Host:** `opc@170.9.33.109`  
**Chave (máquina local Windows):** `C:\Users\ivans\.ssh\ssh-key-oracle.key`

## Limitação do agente Cloud

Nesta VM do Cursor **não há** a chave Oracle do usuário. Tentativa:

```text
Permission denied (publickey,gssapi-keyex,gssapi-with-mic)
```

O agente continua o desenvolvimento/CI na cloud e no GitHub. Deploy na VPS deve ser feito **na sua máquina** (ou colando a chave privada num secret do ambiente Cloud, se desejar automação futura).

## Conectar (no seu PC)

```bash
ssh -i "C:\Users\ivans\.ssh\ssh-key-oracle.key" opc@170.9.33.109
```

Linux/macOS (se a chave estiver em `~/.ssh`):

```bash
chmod 600 ~/.ssh/ssh-key-oracle.key
ssh -i ~/.ssh/ssh-key-oracle.key opc@170.9.33.109
```

## Checklist pós-merge na VPS (se a API/app rodar lá)

1. `git fetch && git checkout main && git pull`
2. `npm ci` (ou install)
3. Aplicar schema aditivo se necessário:
   - `npm run db:estoque-custo:apply`
   - `npm run db:producao-real:apply`
   - `npm run db:cultivo-fase:apply`
4. Reiniciar o serviço da API (pm2/systemd/docker conforme o setup)
5. Smoke:

```bash
EXPO_PUBLIC_API_BASE_URL=https://SUA_API_VPS npm run smoke:plano-auxiliar
```

## Produção já homologada (Railway + Vercel)

Independente da VPS, o ciclo plano auxiliar já está em:

- API: `https://afu-mobile-v2-production.up.railway.app`
- Web: `https://afu-mobile-web.vercel.app`
- Release: `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`

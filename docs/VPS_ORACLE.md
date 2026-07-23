# VPS Oracle — acesso e deploy AFU

**Host:** `opc@170.9.33.109`  
**Chave (máquina local Windows):** `C:\Users\ivans\.ssh\ssh-key-oracle.key`

## Limitação do agente Cloud (atual)

Nesta VM **ainda não há** a chave Oracle montada em `~/.ssh/ssh-key-oracle.key`.  
A chave do agente (`~/.ssh/id_ed25519`) é oferecida ao servidor, mas a VPS rejeita:

```text
Offering public key: ... ED25519 SHA256:GO/z+mGgzzzYTS4tTsXTrj/fdTVpe3NHb8a+cMQkiRA
Permission denied (publickey,gssapi-keyex,gssapi-with-mic)
```

Isso significa: o host responde, mas a pubkey do agente **não está** em `~opc/.ssh/authorized_keys` (ou está em arquivo/usuário errado).

### Opção A — autorizar a chave pública deste agente na VPS (recomendado)

No seu PC (PowerShell ou Git Bash):

```bash
ssh -i "C:\Users\ivans\.ssh\ssh-key-oracle.key" opc@170.9.33.109
```

**Na VPS** (cole exatamente estas 4 linhas):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
grep -q 'ubuntu@cursor' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGIwXELwm4gLlbD4FaFzT9d9hneoN291uCe2rn+47Oj8 ubuntu@cursor' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
grep 'ubuntu@cursor' ~/.ssh/authorized_keys
```

Fingerprint esperada na VPS após o `grep`:

`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGIwXELwm4gLlbD4FaFzT9d9hneoN291uCe2rn+47Oj8 ubuntu@cursor`

Depois disso o agente Cloud consegue `ssh opc@170.9.33.109`.

### Opção B — secret do ambiente Cloud

Adicione o conteúdo de `ssh-key-oracle.key` como secret e monte em  
`~/.ssh/ssh-key-oracle.key` (chmod 600) no setup do ambiente Cloud  
(`https://cursor.com/dashboard/cloud-agents/environments/e/6a47262b-7e0f-11f1-ba66-0e7d0216e441`).  
Reinicie o agent.

## Conectar (no seu PC)

```bash
ssh -i "C:\Users\ivans\.ssh\ssh-key-oracle.key" opc@170.9.33.109
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
EXPO_PUBLIC_API_BASE_URL=https://SUA_API_VPS npx tsx scripts/smoke-resultado-cultivo.ts
```

## Produção já homologada (Railway + Vercel)

- API: `https://afu-mobile-v2-production.up.railway.app`
- Web: `https://afu-mobile-web.vercel.app`
- Release ciclo auxiliar: `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`
- PR #23 (UX + PDF resultado): merge `4077777`
- Smoke PDF prod: `docs/evidencias/smoke-resultado-cultivo-latest.json` (**AVANÇAR**)

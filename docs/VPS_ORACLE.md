# VPS Oracle — acesso e inventário AFU

**Host:** `opc@170.9.33.109` (`sbr`, Oracle Linux 10.2)  
**Chave (máquina local Windows):** `C:\Users\ivans\.ssh\ssh-key-oracle.key`  
**Agente Cloud:** SSH OK via `~/.ssh/id_ed25519` (pubkey `ubuntu@cursor` em `authorized_keys`).

## Conectar

```bash
# PC (Windows)
ssh -i "C:\Users\ivans\.ssh\ssh-key-oracle.key" opc@170.9.33.109

# Agente Cloud
ssh -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519 opc@170.9.33.109
```

Pubkey do agente (já autorizada):

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGIwXELwm4gLlbD4FaFzT9d9hneoN291uCe2rn+47Oj8 ubuntu@cursor
```

## Inventário (2026-07-23)

| Item | Status |
|------|--------|
| AFU Mobile (API/app) | **Não instalado** — sem repo, Node, pm2 |
| nginx :80 | Default Oracle Linux test page |
| Docker Ollama :11434 | Up — modelo `llama3.1:latest` (~4.9 GB) |
| Docker n8n :5678 | Up (`/home/opc/n8n/docker-compose.yml`) |
| MySQL / API AFU | Ausente nesta VPS |
| Node.js / npm | Ausente |
| Disco root `/` | **28 GB** — era 100% cheio; liberado ~2.4 GB |
| `/var/oled` | 20 GB livres (partição OCI; não usada pelo app) |
| RAM | 46 GB |

### Limpeza já feita pelo agente

1. Removido download **parcial** Ollama (`*-partial*` em `ollama_storage`).
2. Removido container/imagem `hello-world`.
3. Removido `/usr/local/lib/ollama` (CUDA nativo **inativo**; Ollama em uso é o container Docker).
4. Vacuum leve de journal/logs PCP.

Ollama e n8n permaneceram no ar após a limpeza.

### Risco de disco

Root de 28 GB é apertado para Ollama (imagem CUDA + modelo) **e** um deploy Node completo (`npm ci` deste monorepo).  
Antes de hospedar AFU aqui, preferir:

1. **Expandir** o boot volume OCI (recomendado), ou
2. Mover `data-root` do Docker para `/var/oled` (20 GB livres), ou
3. Manter AFU em Railway/Vercel e usar a VPS só para Ollama/n8n.

## Checklist se for deployar AFU nesta VPS

Pré-requisitos: ≥8 GB livres no root (ou Docker em `/var/oled`) + Node 22 LTS.

1. Instalar Node (ex.: NodeSource / fnm) e clonar o repo.
2. Configurar `.env` (`DATABASE_URL`, `JWT_SECRET`, …).
3. `npm ci`
4. Schema aditivo se necessário:
   - `npm run db:estoque-custo:apply`
   - `npm run db:producao-real:apply`
   - `npm run db:cultivo-fase:apply`
5. Subir API (pm2/systemd/docker) e reverse-proxy nginx.
6. Smoke:

```bash
EXPO_PUBLIC_API_BASE_URL=https://SUA_API_VPS npm run smoke:plano-auxiliar
EXPO_PUBLIC_API_BASE_URL=https://SUA_API_VPS npm run smoke:resultado-cultivo
```

## Produção já homologada (Railway + Vercel)

- API: `https://afu-mobile-v2-production.up.railway.app`
- Web: `https://afu-mobile-web.vercel.app`
- Release ciclo auxiliar: `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`
- PR #23 (UX + PDF resultado): merge `4077777`
- Smoke PDF prod: `docs/evidencias/smoke-resultado-cultivo-latest.json` (**AVANÇAR**)

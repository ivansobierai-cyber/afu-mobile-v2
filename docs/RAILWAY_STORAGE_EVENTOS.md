# Storage privado (R2/S3 recomendado) — anexos Eventos, relatórios

**Credenciais não ficam no GitHub** — só no Railway (serviço API) e no `.env` local.

## Opção A — Cloudflare R2 ou S3 (recomendado, sem Manus)

No Railway → serviço API → **Variables**:

| Variável | Exemplo R2 |
|----------|----------------|
| `STORAGE_S3_BUCKET` | `afu-private` |
| `STORAGE_S3_ACCESS_KEY_ID` | token R2 |
| `STORAGE_S3_SECRET_ACCESS_KEY` | secret R2 |
| `STORAGE_S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `STORAGE_S3_REGION` | `auto` (opcional) |

Aliases aceitos: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL`, `S3_BUCKET`, `R2_*` equivalentes.

**Importante:** variáveis no serviço da **API** (`afu-mobile-v2`), não no Vercel. Após salvar, force **Redeploy**.

Se **S3** estiver configurado, ele tem **prioridade** sobre Forge legado.

### Passo a passo — Cloudflare R2 (primeira vez)

1. **Conta Cloudflare** → [dash.cloudflare.com](https://dash.cloudflare.com) → menu **R2 Object Storage**.
2. **Create bucket** → nome ex.: `afu-private` (só letras minúsculas, números, hífen). Região: padrão.
3. **Account ID** — na visão geral do R2 (barra lateral ou URL), anote o *Account ID* (32 caracteres).
4. **API token** → R2 → **Manage R2 API Tokens** → **Create API token**:
   - Permissão: **Object Read & Write** (no bucket `afu-private` ou em todos, conforme preferir).
   - Copie **Access Key ID** e **Secret Access Key** (o secret só aparece uma vez).
5. **Endpoint S3** (formato fixo):
   ```text
   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```
   Substitua `<ACCOUNT_ID>` pelo ID do passo 3. **Não** use URL de domínio público/custom domain do bucket para a API — só `*.r2.cloudflarestorage.com`.
6. **Railway** → projeto AFU → serviço **API** (não MySQL, não Vercel) → **Variables** → adicione:

   | Variável | Valor |
   |----------|--------|
   | `STORAGE_S3_BUCKET` | `afu-private` |
   | `STORAGE_S3_ACCESS_KEY_ID` | Access Key do token |
   | `STORAGE_S3_SECRET_ACCESS_KEY` | Secret do token |
   | `STORAGE_S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
   | `STORAGE_S3_REGION` | `auto` |

7. **Deploy** → **Redeploy** do serviço API.
8. Validar:
   ```bash
   curl -s https://afu-mobile-v2-production.up.railway.app/api/health
   ```
   Esperado: `"backend":"s3"`, `"storageReady":true`, `s3EnvPresent` com os quatro `true`.

**Custo:** R2 tem tier gratuito generoso para começar (ver preços Cloudflare). Não precisa expor o bucket na internet pública — só a API assina URLs.

**Dev local (opcional):** mesmas variáveis no `.env` para testar upload no `localhost:3000`.

## Opção B — Forge legado (`BUILT_IN_FORGE_*`)

Variáveis do template Manus (presign via API). Use só se já tiver endpoint compatível.

---


```bash
curl -s https://afu-mobile-v2-production.up.railway.app/api/health | jq .
```

Esperado quando OK:

```json
{
  "ok": true,
  "storage": {
    "backend": "s3",
    "s3Configured": true,
    "storageReady": true
  }
}
```

| `backend` | `storageReady` | Significado |
|-----------|----------------|-------------|
| `none` | `false` | Sem R2/S3 nem Forge |
| `s3` | `true` | Upload/download de arquivo OK |
| `s3` | `false` | Credencial/bucket inválidos — ver `storageHint` |
| `forge` | `true`/`false` | Modo legado presign |

Smoke completo:

```bash
EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app npm run smoke:eventos-anexos
```

Checks `addAnexoArquivo`, `getAnexoDownloadUrl` e `download arquivo (GET)` deixam de ser apenas “opcional”.

---

## 4. UI (web)

Checklist manual: `docs/evidencias/SMOKE_EVENTOS_ANEXOS_UI.md` (Mais → Calendário → evento → Anexos).

---

## 5. Troubleshooting

- **502/503 no download** (`/manus-storage/…`): JWT/proxy — conferir `JWT_SECRET` e login; com Forge OK, download usa URL assinada S3.
- **PRECONDITION_FAILED** no upload: storage não configurado (`STORAGE_S3_*` ou Forge).
- **500 “Falha ao armazenar”** com `storageReady: true`: logs `[calendario.addAnexoArquivo]`.
- **`storageHint` com UnknownError / HTTP 403**: conferir endpoint S3 (`*.r2.cloudflarestorage.com`), nome do bucket igual ao R2, token com **Object Read & Write** neste bucket. Teste `STORAGE_S3_FORCE_PATH_STYLE=true` se ainda falhar.

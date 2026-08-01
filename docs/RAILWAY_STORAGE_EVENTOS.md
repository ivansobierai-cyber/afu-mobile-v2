# Storage privado no Railway (anexos Eventos, relatórios, etc.)

**Credenciais não ficam no GitHub** — só em variáveis do serviço API no Railway (e no seu `.env` local). O código usa nomes legados `BUILT_IN_FORGE_*` do template; não é obrigatório ser Manus.

Uploads (`addAnexoArquivo`, diagnósticos, PDFs) usam API **OpenAI-compatível + presign S3** via `server/storage.ts`. Sem as variáveis abaixo, links de anexo continuam funcionando; **arquivos** falham.

---

## 1. Variáveis no serviço API (`afu-mobile-v2`)

No [Railway](https://railway.app) → projeto → serviço da API → **Variables**:

| Variável | Valor |
|----------|--------|
| `BUILT_IN_FORGE_API_URL` | URL base de API com rotas `v1/storage/presign/*` e (opcional) `v1/chat/completions` |
| `BUILT_IN_FORGE_API_KEY` | Bearer token dessa API |

Já obrigatórias no mesmo serviço: `DATABASE_URL`, `JWT_SECRET`.

Referência geral: `docs/SEGURANCA_OPERACAO_SUPORTE.md` (§ variáveis críticas).

---

## 2. Onde obter URL e chave

- Qualquer provedor que exponha o mesmo contrato de presign do template (histórico Manus Forge), **ou** variáveis que você já tinha no Railway antes de remover Manus.
- Se não usar storage na nuvem: deixe sem configurar — login, calendário e anexos **por URL** seguem normais; só upload de arquivo fica desligado até existir S3/R2 nativo no repo (backlog).

---

## 3. Validar após redeploy

```bash
curl -s https://afu-mobile-v2-production.up.railway.app/api/health | jq .
```

Esperado quando OK:

```json
{
  "ok": true,
  "storage": {
    "forgeConfigured": true,
    "forgePresignOk": true
  }
}
```

| `forgeConfigured` | `forgePresignOk` | Significado |
|-------------------|------------------|-------------|
| `false` | `false` | Faltam `BUILT_IN_FORGE_*` no Railway |
| `true` | `false` | Vars setadas, mas URL/chave inválida ou Forge indisponível (`storageHint` traz detalhe) |
| `true` | `true` | Upload de arquivo deve funcionar |

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
- **PRECONDITION_FAILED** no upload: mensagem explícita de Forge ausente (após deploy deste diagnóstico).
- **500 “Falha ao armazenar”** com `forgePresignOk: true`: ver logs Railway `[calendario.addAnexoArquivo]` (PUT S3, DB `private_files`, etc.).

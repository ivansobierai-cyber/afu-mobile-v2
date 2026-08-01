# Storage privado no Railway (anexos Eventos, relatórios, etc.)

Uploads (`addAnexoArquivo`, diagnósticos, PDFs) usam **Forge/Manus Storage** (presign S3). Sem as variáveis abaixo, links de anexo continuam funcionando; **arquivos** falham.

---

## 1. Variáveis no serviço API (`afu-mobile-v2`)

No [Railway](https://railway.app) → projeto → serviço da API → **Variables**:

| Variável | Valor |
|----------|--------|
| `BUILT_IN_FORGE_API_URL` | URL base da API Forge/Manus (ex.: `https://…/`, sem path extra) |
| `BUILT_IN_FORGE_API_KEY` | Chave Bearer do mesmo projeto Manus/Forge |

Já obrigatórias no mesmo serviço: `DATABASE_URL`, `JWT_SECRET`.

Referência geral: `docs/SEGURANCA_OPERACAO_SUPORTE.md` (§ variáveis críticas).

---

## 2. Onde obter URL e chave

- Projeto criado no **Manus** / template WebDev: variáveis costumam existir no painel do projeto ou no ambiente de build original.
- Se não tiver mais acesso: criar novo app Manus com storage habilitado **ou** planejar adapter S3/R2 (não implementado neste repo — hoje só Forge presign).

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

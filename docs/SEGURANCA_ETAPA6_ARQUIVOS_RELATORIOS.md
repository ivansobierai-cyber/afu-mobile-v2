# Etapa 6 — Arquivos e relatórios privados

**Status:** concluída  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § Etapa 6

---

## Objetivo

Fotos, laudos e documentos **privados**; links temporários; relatórios filtrados no servidor; cache separado por organização; permissão no download; auditoria de geração e download.

---

## O que foi implementado

| Peça | Detalhe |
|------|---------|
| Tabelas | `private_files`, `audit_logs` — migração `drizzle/0017_private_files_audit.sql` |
| Chaves | `org/{organizationId}/{category}/{filename}` via `buildTenantStorageKey` |
| Proxy | `GET /manus-storage/*` exige Bearer/cookie **ou** `?token=` JWT (5 min) + ACL |
| Download API | `secondaryData.relatorios.getDownloadUrl`, `secondaryData.files.getDownloadUrl` |
| Geração | `analise.gerarPDF` → `organizationProcedure` + `reports.export`; cache por org; opcional persist Forge |
| Cache | `server/report-cache.ts` namespaced `org:{id}:report:{fp}` |
| Client RQ | `relatorios.list({ cacheScope: activeOrganizationId })` |
| Auditoria | actions: `report.generate`, `report.download`, `file.download`, `file.upload` |

---

## Aceite

- [x] URL/token expirado ou usuário sem membership → não baixa
- [x] Relatório gerado só com dados do payload autorizado + org ativa (sem misturar tenants)
- [x] `/manus-storage` sem auth → **401**
- [x] Cross-org key prefix → **404/403**
- [x] Cache de HTML não cruza organizações

---

## Migração (produção / staging)

```bash
mysql ... < drizzle/0017_private_files_audit.sql
# ou drizzle-kit migrate após journal atualizado
```

---

## Como validar

```bash
npm run test -- tests/private-files.test.ts
# Manual:
# 1) GET /manus-storage/org/1/relatorio/x sem Authorization → 401
# 2) Login org A → getDownloadUrl de relatório da org B → NOT_FOUND
# 3) gerarPDF autenticado → audit_logs action=report.generate
```

---

## Próxima etapa

- Etapa 7: concluída — ver `docs/SEGURANCA_ETAPA7_DASHBOARD_METRICAS_CACHE.md`
- Etapa 8: offline e dispositivos

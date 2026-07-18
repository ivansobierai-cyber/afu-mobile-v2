# Etapa 2 — Organizações e membership

**Status:** implementada  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Prompt:** `docs/AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md`  
**Pré-requisito:** Etapa 1 (`docs/SEGURANCA_ETAPA1_AUDITORIA_MULTITENANT.md`)

## O que foi entregue

| Item | Detalhe |
|------|---------|
| Tabelas | `organizations`, `organization_memberships` (unique org+user) |
| Sessão | `usuarios_afu.activeOrganizationId` |
| Ponte tenant | `produtores.organizationId` (pré-Etapa 3) |
| Papéis | matriz em `lib/security/org-roles.ts` |
| API | `organizations.*` + `organizationProcedure` / `orgPermissionProcedure` |
| Sessão auth | `auth.session` retorna `organizations`, `activeOrganizationId`, `activeRole` |
| Backfill | `npx tsx scripts/backfill-organizations.ts` ou `organizations.backfill` (admin) |
| P0-4 | Signup público **não** aceita mais `administrador` |

## Aceite

- Usuário **sem membership** → `organizations.get` / `setActive` / `organizationProcedure` → **FORBIDDEN**
- `setActive` só aceita org com membership ativo; troca `activeOrganizationId` e retorna `scopeChangedAt`
- Cliente deve invalidar React Query ao trocar org (documentado; UI seletor pode vir na Etapa 4/7)

## Migration

`drizzle/0015_organizations.sql`

## Etapa 3

Ver `docs/SEGURANCA_ETAPA3_MIGRACAO_ORGANIZATION_ID.md` — `organizationId` preenchido nas tabelas privadas.

## Ainda fora (Etapa 4+)

- RLS / repositório único / filtros API por org
- IDORs P0-1/2/3/5
- Seletor visual de organização no app
- `organizationId` NOT NULL

## Como validar

```bash
sudo service mysql start   # ou socket local
# aplicar 0015
npx tsx scripts/backfill-organizations.ts
npm run test -- tests/org-roles.test.ts
# login demo → auth.session deve trazer activeOrganizationId
# organizations.get com org alheia → FORBIDDEN
```

# Etapa 5 — Repositórios e defesa equivalente a RLS

**Status:** concluída  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § Etapa 5

---

## Decisão de plataforma

| Item | Resultado |
|------|-----------|
| Banco | **MySQL 8** — **não** oferece Row-Level Security nativo (como Postgres) |
| Estratégia | Camada obrigatória de consultas protegidas (`server/tenant-db.ts`) + mutações endurecidas em `db*.ts` |
| Aceite | Consulta/mutação “defeituosa” que use a camada **não** lê/escreve outro tenant |

---

## Camada obrigatória

### `createTenantDb(organizationId)` — `server/tenant-db.ts`

- SELECT / UPDATE / DELETE sempre com `WHERE id AND organizationId`
- UPDATE faz strip de `organizationId` no payload (impede mover registro entre orgs)
- `require*` → `NOT_FOUND` genérico (`Recurso não encontrado`)
- Agregados (`dashboardStats`) filtrados pela org

### Endurecimento em `server/db.ts` / `db-propriedade-expansao.ts`

- `create*` de tabelas privadas **falha** se `organizationId` não puder ser resolvido
- `update*` / `delete*` exigem `organizationId` no WHERE (assinatura alterada)
- Geometria / ocorrência / custo / estoque / orçamento / atividade carimbam org

### API (Etapa 4) → DB (Etapa 5)

`tenant-access.require*InTenant` agora **delega** a `createTenantDb`.

---

## Tabelas cobertas (14 + creates)

`propriedades`, `terrenos`, `culturas`, `diagnosticos_ia`, `analises_fitotecnicas`, `relatorios`, `calendario_cuidados`, `tarefas_operacionais`, `sensores`, `ocorrencias_campo`, `estoque_itens`, `orcamentos_safra`, `custos_operacao`, `atividade_propriedade`

Filhos sem coluna (`apontamentos_operacao`, `estoque_movimentos`) acessados só via pai já escopado.

---

## Testes

```bash
npm run test -- tests/tenant-db.isolation.test.ts
node scripts/check-tenant-queries.mjs
```

O teste de isolamento usa o MySQL local com ≥2 orgs (seed/backfill).

---

## Política para PRs

1. Routers **não** devem fazer `select/update/delete` direto em tabelas privadas sem `organizationId`.
2. Preferir `createTenantDb(ctx.tenant.organizationId)`.
3. Jobs de plataforma (ex.: clima em lote) devem usar caminho explícito documentado — não a API tenant.

---

## Próxima etapa

- Etapa 6: concluída — ver `docs/SEGURANCA_ETAPA6_ARQUIVOS_RELATORIOS.md`
- Etapa 7: concluída — ver `docs/SEGURANCA_ETAPA7_DASHBOARD_METRICAS_CACHE.md`

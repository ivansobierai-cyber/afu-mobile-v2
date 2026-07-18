# Etapa 7 — Dashboard, métricas e cache

**Status:** concluída  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § 9 / Etapa 7

---

## Objetivo

Cards e KPIs usam somente a organização ativa; indicadores de propriedade respeitam safra; o cache React Query de um cliente nunca é entregue a outro; invalidação atinge só o escopo correto.

---

## O que foi implementado

| Peça | Detalhe |
|------|---------|
| Cache namespace | `lib/trpc-cache-scope.ts` — `cacheScope` (= `activeOrganizationId`) no input das queries tenant |
| Hook cliente | `hooks/use-tenant-query-scope.ts` — `cacheInput` / `withScope`; `queryClient.clear()` ao trocar org |
| Dashboard KPIs | `coreData.dashboard.stats` via `createTenantDb(...).dashboardStats()` |
| Listagens | propriedades, cultivos, calendário, análises, relatórios, `diagnostico.historico` com `cacheScope` |
| Métricas | `expansao.metricas` / `overview` / `alertas` aceitam `nomeSafra` + `cacheScope` |
| Safra | `safraLabelsMatch()` filtra orçamentos/custos da safra ativa na propriedade |
| Invalidação | `invalidateDashboardTenantQueries(utils, orgId)`; mutações passam `cacheInput` / escopo da propriedade+safra |
| Troca de org | Perfil `organizations.setActive` → `queryClient.clear()` + invalidate session |

### Chave de cache (cliente)

```text
[procedurePath, { input: { …filtros, cacheScope: organizationId }, type: "query" }]
```

O servidor **ignora** `cacheScope` e usa sempre o membership da sessão (`organizationProcedure` + `tenant-db`). O campo existe só para namespacing no React Query.

---

## Aceite

- [x] Dois clientes / orgs com o mesmo `propriedadeId` têm query keys distintas (`cacheScope` diferente)
- [x] Cards do dashboard leem listas / `dashboard.stats` da org ativa
- [x] Métricas e overview filtráveis por `nomeSafra`
- [x] Troca de organização limpa o QueryClient (sem entregar cache do cliente anterior)
- [x] Invalidação pós-mutação usa input com `cacheScope` (e propriedade/safra quando aplicável)

---

## Como validar

```bash
npm run test -- tests/trpc-cache-scope.test.ts
```

Manual (web):

1. Login org A → anotar cards do dashboard.
2. Em Perfil, trocar para org B → cards devem mudar; sem “flash” de dados de A.
3. Abrir propriedade com safra atual → métricas/overview refletem orçamentos da safra.
4. Mesmo `propriedadeId` em orgs distintas → nunca misturam KPIs (servidor + cache).

---

## Próxima etapa

- Etapa 8: offline e dispositivos — banco local / filas por usuário+org; revalidar tenant na sync

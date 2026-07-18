# Etapa 4 — Proteção das APIs (autorização tenant-aware)

**Status:** concluída  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § Etapa 4

---

## Objetivo

Toda requisição privada valida, no servidor:

1. Sessão (`ctx.user`)
2. Organização ativa
3. Membership ativo
4. Papel/permissão (`lib/security/org-roles.ts`)
5. Propriedade no tenant (`organizationId`)
6. Relações internas (talhão/cultivo/tarefa ligados à mesma org/propriedade)

Alterar um ID na URL/API **não revela** dados de outro cliente → `NOT_FOUND` genérico (`Recurso não encontrado`).

---

## Camadas adicionadas

| Camada | Arquivo | Função |
|--------|---------|--------|
| `organizationProcedure` | `server/_core/trpc.ts` | Sessão + org ativa + membership |
| `orgPermissionProcedure(perm)` | idem | + permissão do papel |
| `propertyProcedure` | idem | + `propriedadeId`/`id` no tenant |
| Helpers | `server/tenant-access.ts` | `require*InTenant`, `assertRelatedIdsInTenant` |

---

## Endpoints migrados

| Router | Mudança |
|--------|---------|
| `coreData.propriedades/terrenos/cultivos/calendario` | `organizationProcedure` + filtros por `organizationId` |
| `coreData.tarefas` | `requireTarefaInTenant` / `assertRelatedIdsInTenant` |
| `coreData.expansao` | propriedade + org em alertas/ocorrências/estoque/custos/métricas |
| `relatorios` / `analisesFitotecnicas` | get/update/delete por org (fecha IDOR P0) |
| `culturasPragas.culturas.list/get` | só cultivos da org ativa (não dump global) |
| `weather.byPropriedade` | `requirePropertyInTenant` |
| `piloto.*` listagens / `bancoAgronomico.noc.*` | `adminProcedure` |

---

## Aceite

- [x] Cross-tenant get retorna `NOT_FOUND` sem payload
- [x] Listagens privadas usam `organizationId` da org ativa
- [x] Creates validam FKs (propriedade/terreno/cultura) no tenant
- [x] Papéis sem permissão recebem `FORBIDDEN`
- [x] Testes unitários de superfície: `tests/tenant-access.test.ts`

---

## Fora desta etapa (próximas)

- Etapa 5: concluída — ver `docs/SEGURANCA_ETAPA5_REPOSITORIOS_RLS.md`
- Etapa 6: concluída — ver `docs/SEGURANCA_ETAPA6_ARQUIVOS_RELATORIOS.md`
- Etapa 7: dashboard/métricas e cache
- Etapa 8: fila offline namespaced por org

---

## Como validar manualmente

1. Login demo → listar propriedades/relatórios da org.
2. Trocar `id` de relatório/propriedade/tarefa de outro tenant (ou ID inexistente) → `NOT_FOUND`.
3. Usuário sem `reports.export` → create/update relatório → `FORBIDDEN`.

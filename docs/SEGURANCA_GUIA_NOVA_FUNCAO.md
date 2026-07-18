# Guia — criar uma nova função sem quebrar isolamento

**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § 16  
**Branch de referência:** `cursor/security-multitenant-audit-fd64`

Use este checklist sempre que adicionar tabela, endpoint, tela, arquivo, cache ou fila offline.

---

## Regra de ouro

1. O dono lógico dos dados privados é a **organização**, não o usuário.
2. Autorização **sempre no servidor** (membership + papel + recurso).
3. Cross-tenant responde `NOT_FOUND` (não confirmar existência).
4. Nunca confiar em `organizationId` / IDs vindos do cliente.

---

## Checklist mínimo (nova feature privada)

| # | Passo | Onde |
|---|--------|------|
| 1 | Coluna `organizationId` na tabela | `drizzle/schema.ts` + migração SQL |
| 2 | Registrar em `TENANT_PRIVATE_TABLES` | `server/tenant-db.ts` |
| 3 | Helpers `list*` / `get*` / `require*` via `createTenantDb` | `server/tenant-db.ts` |
| 4 | Procedure `organizationProcedure` ou `orgPermissionProcedure("…")` | `server/_core/trpc.ts` |
| 5 | No **create**, carimbar `organizationId: tenant.organizationId` | router (ex.: `core-data-router.ts`) |
| 6 | Em FKs relacionados, `assertRelatedIdsInTenant` / `requirePropertyInTenant` | `server/tenant-access.ts` |
| 7 | Cliente: passar `cacheScope` / `cacheInput` | `hooks/use-tenant-query-scope.ts` |
| 8 | Offline (se houver): chaves com `tenantStorageKey` | `lib/offline/tenant-scope.ts` |
| 9 | Arquivos: `buildTenantStorageKey` + download autenticado | `server/private-files.ts` |
| 10 | Teste A vs B em `tests/cross-tenant-attack.test.ts` | + `tests/helpers/tenant-fixture.ts` |
| 11 | Auditoria em mutações sensíveis | `writeAuditLog` |

---

## 1. Procedures (API)

```ts
// Leitura no escopo da org ativa
organizationProcedure.query(async ({ ctx }) => {
  const { createTenantDb } = await import("../tenant-db");
  return createTenantDb(ctx.organizationId).listSomething();
});

// Escrita com permissão
orgPermissionProcedure("property.write").mutation(async ({ ctx, input }) => {
  // usar ctx.tenant.organizationId — nunca input.organizationId
});
```

Arquivos: `server/_core/trpc.ts`, `server/tenant-access.ts`.

| Helper | Uso |
|--------|-----|
| `requireTenantContext` | Sessão + membership ativo |
| `requireOrgPermission` | Papel × permissão |
| `requirePropertyInTenant` / `requireTerrenoInTenant` | Recurso pertence à org |
| `assertRelatedIdsInTenant` | FKs não apontam para outro tenant |

---

## 2. Camada de dados (equiv. RLS)

Preferir `createTenantDb(organizationId)` em vez de queries soltas em `server/db.ts`.

- `list*` / `get*` / `require*` / `update*` / `delete*` já filtram por org.
- `requireInsertOrganizationId` impede INSERT sem org.
- UPDATE não pode alterar `organizationId` (`stripOrg`).

---

## 3. Papéis e permissões

Fonte: `lib/security/org-roles.ts`.

Papéis: `proprietario`, `administrador`, `gerente`, `agronomo`, `operador`, `consultor`, `auditor`.

**Nova permissão:**

1. Adicionar ao union `OrgPermission`.
2. Incluir em `ALL_PERMS` e na matriz `ROLE_PERMISSIONS`.
3. Gatear com `orgPermissionProcedure("nova.perm")`.

---

## 4. Arquivos e relatórios

- Chave: `org/{organizationId}/{categoria}/{arquivo}` via `buildTenantStorageKey`.
- Download: sessão Bearer/cookie **ou** `?token=` JWT curto; proxy `/manus-storage/*`.
- ACL: `assertCanAccessStorageKey` (revalida membership).
- Cache de HTML de relatório: namespaced por org (`server/report-cache.ts`).

---

## 5. Cache no cliente (React Query)

```ts
const { cacheInput, withScope, activeOrganizationId } = useTenantQueryScope();
trpc.meuRouter.list.useQuery(cacheInput, { enabled: !!activeOrganizationId });
```

- `cacheScope` **não** autoriza no servidor — só isola o cache.
- Troca de org limpa o QueryClient (`use-tenant-query-scope.ts`).

---

## 6. Offline

Escopo: `userId + organizationId + deviceId`.

- Filas/DB local: `tenantStorageKey` / `coreQueueStorageKey`.
- Logout: `cleanupOfflineScope(scope, "logout")`.
- Admin offline: `lib/admin/admin-storage-scope.ts` (`afu:admin:u*:o*:*`).
- Não reutilizar chaves globais `admin_*` / `afu_core_mutation_queue`.

---

## 7. IA

- Procedure: `organizationProcedure` + permissão adequada.
- Validar `propriedadeId` / FKs **antes** de chamar o LLM (`assertAiPropertyScope`).
- Prompts mínimos; `store: false`; sem PII desnecessária.
- Auditoria: `auditAiInvocation` / `ai.invoke`.
- Manter `AI_ALLOW_TRAINING=false` em ambientes compartilhados.

---

## 8. Auditoria

```ts
await writeAuditLog({
  organizationId: tenant.organizationId,
  actorUserId: tenant.userId,
  action: "admin.mutation", // ou file.download / ai.invoke / …
  resourceType: "…",
  resourceId: String(id),
});
```

`adminProcedure` já audita path/input redigido (`safe-logger`).

---

## 9. Teste obrigatório (copiar padrão)

```ts
const { a, b } = await createIsolatedTenantPair();
await expectTenantDenied(a.caller.meuRouter.get({ id: b.recursoId }));
```

Rodar: `npm run test:security:etapa10`.

Casos mínimos: list isolation, get/update/delete cruzado, FK cruzada, arquivo, membership removido.

---

## Anti-padrões (não fazer)

- Filtrar só no frontend / esconder botão.
- `protectedProcedure` sem checagem de org em dado privado.
- Aceitar `organizationId` do input do cliente.
- Chaves AsyncStorage globais (`admin_conteudos`, filas sem prefixo).
- URLs de arquivo públicas permanentes.
- Recriar org/membership em toda resolução de sessão (já corrigido na Etapa 10).
- Mensagens do tipo “você não tem acesso ao recurso X da org Y”.

---

## Referências por etapa

| Tema | Doc |
|------|-----|
| Auditoria inicial | `SEGURANCA_ETAPA1_AUDITORIA_MULTITENANT.md` |
| Orgs / membership | `SEGURANCA_ETAPA2_ORGANIZACOES.md` |
| `organizationId` | `SEGURANCA_ETAPA3_MIGRACAO_ORGANIZATION_ID.md` |
| APIs | `SEGURANCA_ETAPA4_PROTECAO_APIS.md` |
| tenant-db | `SEGURANCA_ETAPA5_REPOSITORIOS_RLS.md` |
| Arquivos | `SEGURANCA_ETAPA6_ARQUIVOS_RELATORIOS.md` |
| Cache/dashboard | `SEGURANCA_ETAPA7_DASHBOARD_METRICAS_CACHE.md` |
| Offline | `SEGURANCA_ETAPA8_OFFLINE_DISPOSITIVOS.md` |
| IA / logs | `SEGURANCA_ETAPA9_IA_LOGS_GOVERNANCA.md` |
| Testes / rollout | `SEGURANCA_ETAPA10_TESTES_IMPLANTACAO.md` |
| Operação | `SEGURANCA_OPERACAO_SUPORTE.md` |

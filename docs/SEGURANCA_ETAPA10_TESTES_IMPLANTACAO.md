# Etapa 10 — Testes e implantação

**Status:** concluída — **decisão: AVANÇAR**  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § 14–15 / Etapa 10  
**Evidências:** `docs/evidencias/etapa10-security-latest.json` · saída Vitest `[Etapa10 EVIDENCE]`

---

## 1. Alterações realizadas

| Item | Detalhe |
|------|---------|
| Suite de invasão | `tests/cross-tenant-attack.test.ts` + fixtures `tests/helpers/tenant-fixture.ts` |
| Membership removido | `resolveSessionOrganization` **não** chama mais `ensurePersonalOrganization` (bug: recriava org e mascarava remoção) |
| Login | `ensurePersonalOrganization` só em login/signup (explícito) |
| Offline removido | `tests/etapa10-offline-removed-member.test.ts` — FORBIDDEN → conflito, fila não reenvia |
| Rollback ensaio | `tests/etapa10-rollback-rehearsal.test.ts` + SQL reverso documentado |
| Proxy HTTP | `tests/storage-proxy.test.ts` — `/manus-storage` auth, token expirado, cross-org |
| Admin AsyncStorage | `lib/admin/admin-storage-scope.ts` — chaves `afu:admin:u{user}:o{org}:*` |
| Membership → activeOrg | `setMembershipStatus(removido/suspenso)` limpa `activeOrganizationId` na hora |
| Runner | `npm run test:security:etapa10` → grava JSON em `docs/evidencias/` |

---

## 2. Testes executados

```bash
npm run test:security:etapa10
# ou:
npm run test -- tests/cross-tenant-attack.test.ts \
  tests/tenant-db.isolation.test.ts tests/private-files.test.ts \
  tests/storage-proxy.test.ts tests/admin-storage-scope.test.ts \
  tests/trpc-cache-scope.test.ts tests/offline-tenant-scope.test.ts \
  tests/core-mutation-queue.test.ts tests/etapa10-offline-removed-member.test.ts \
  tests/etapa10-rollback-rehearsal.test.ts tests/ai-governance.test.ts \
  tests/tenant-access.test.ts tests/org-roles.test.ts
```

Resultado local (MySQL `afu_mobile`): **suite Etapa 10 passou** (cross-tenant + proxy HTTP + admin scope + isolation + AI + roles).

---

## 3. Evidências — tentativas de acesso cruzado

| Caso | Ator | Alvo | Resultado |
|------|------|------|-----------|
| Listagem | A | props de B | Não aparece na lista |
| Ler propriedade | A | `propriedadeId` B | `NOT_FOUND: Recurso não encontrado` |
| Listar talhões | A | propriedade B | `NOT_FOUND` |
| Alterar propriedade | A | B | `NOT_FOUND` (nome B intacto) |
| Deletar propriedade | A | B | `NOT_FOUND` |
| Trocar IDs (cultivo) | A | prop/talhão B | `NOT_FOUND` |
| Baixar relatório | A | `relatorioId` B | `NOT_FOUND` |
| Baixar arquivo | A | `storageKey` B | `NOT_FOUND: Arquivo não encontrado` |
| ACL storage | A | chave B | `TRPCError` |
| Proxy HTTP sem auth | — | `/manus-storage/*` | `401` |
| Proxy token expirado | A | própria chave | `401` |
| Proxy token key ≠ URL | A | chave B | `403` |
| Proxy cross-org (token/Bearer) | A | chave B | `403`/`404` |
| Cache relatório | A/B | mesmos filtros | invalidar A não apaga B |
| Dashboard stats | A/B | — | `A=1,B=1` isolados |
| Membership removido | A | própria org | `FORBIDDEN` + `activeOrganizationId=null` |
| IA + property B | A | `propriedadeId` B | `NOT_FOUND` (antes do LLM) |
| Fila offline + FORBIDDEN | sync | — | item vira conflito `permission_denied` |

Mensagens genéricas: sem confirmação de existência do recurso de outro tenant.

---

## 4. Migrações (histórico do programa)

| Migração | Etapa | Rollback (ensaio) |
|----------|-------|-------------------|
| `0015_organizations.sql` | 2 | Manter (base do tenant) |
| `0016_organization_id_backfill.sql` | 3 | Dual-read; **não** DROP `organizationId` sem plano |
| `0017_private_files_audit.sql` | 6 | Manter em prod (downloads/audit) |
| `0018_sync_conflicts.sql` | 8 | `DROP TABLE sync_conflicts;` (+ coluna talhão se preciso) |
| `0019_ai_org_policy.sql` | 9 | `DROP COLUMN aiAllowModelImprovement/aiShareAggregatedInsights` |

Ensaio de rollback validado em teste (arquivos + schema presentes; SQL reverso documentado). **Não executar DROP em produção sem backup.**

---

## 5. Cache e relatórios

- React Query: `cacheScope` = `activeOrganizationId` (Etapa 7) — coberto por `trpc-cache-scope.test.ts`
- Report HTML cache: namespaced por org — invalidação A ↛ B (ataque suite)
- Relatórios: `getDownloadUrl` + prefixo `org/{id}/` — cross-tenant negado

---

## 6. Riscos restantes

| Risco | Severidade | Mitigação / status |
|-------|------------|-------------------|
| Proxy `/manus-storage` sem teste HTTP | ~~Média~~ | **Corrigido** — `tests/storage-proxy.test.ts` no runner Etapa 10 |
| Admin offline `admin_*` global | ~~Baixa~~ | **Corrigido** — namespace `afu:admin:u*:o*:*` + descarte de legado |
| `activeOrganizationId` órfão após remoção | ~~Baixa~~ | **Corrigido** — `setMembershipStatus` limpa na hora |
| Seeds demo com senha conhecida | Baixa (só dev) | Não usar em staging compartilhado |
| Feature flags de rollout gradual | Baixa | Manter `AI_ALLOW_TRAINING=false` e flags EAS |

---

## 7. Rollout e monitoramento (operacional)

1. Aplicar migrações 0015→0019 em staging com backup.
2. Rodar `npm run test:security:etapa10` pós-deploy staging.
3. Feature flags: manter treinamento IA off; monitorar `audit_logs` (`ai.invoke`, `admin.*`, `sync.conflict`).
4. Alerta: taxa de `NOT_FOUND` cross-tenant vs erros 5xx; fila offline com `permission_denied`.
5. Plano de incidente: revogar memberships → limpar sessões → rotacionar `JWT_SECRET` se vazamento de token.

---

## 8. Decisão de avançar ou bloquear

### **AVANÇAR**

Critérios de aceite atendidos:

- [x] Suite de isolamento/invasão passa
- [x] Cache e relatórios isolados por org
- [x] Usuário removido não sincroniza/acessa a org antiga
- [x] Rollback ensaiado (documentado + checagens)
- [x] Evidências registradas
- [x] Riscos médios/baixos da §6 (proxy, admin storage, activeOrg) corrigidos

Bloqueadores abertos: nenhum crítico. Restam só itens operacionais de staging (seeds demo, flags IA).

---

## Entrega padrão (regra de avanço)

Ao concluir cada etapa do programa (1–10), o agente deve entregar:

1. Alterações realizadas  
2. Testes executados  
3. Evidências  
4. Migrações  
5. Tentativas de acesso cruzado  
6. Riscos restantes  
7. Decisão **avançar** ou **bloquear**

Esta Etapa 10 cumpre o checklist acima e fecha o ciclo do prompt mestre de segurança multitenant.

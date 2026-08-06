# SUBFASE 0B — RBAC `diagnostics.write` nas mutations de diagnóstico

**Escopo:** enforcement server-side da permissão `diagnostics.write` antes de efeitos colaterais em mutations de diagnóstico.

**PR:** [#34](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/34) — **MERGED**
**Commit funcional:** `7ecd4b3a87a7d2d5d906c41b7a06dbe5248cc01c`
**Merge commit em `main`:** `37a74ff6d59fb4dc64b08caffbda9878d040886c`

---

## Objetivo

Garantir que apenas papéis com `diagnostics.write` na matriz RBAC possam persistir diagnóstico (`diagnostico.salvar`) ou disparar análise IA (`diagnostico.analisar`), com validação no servidor (não apenas na UI).

---

## Implementação (referência)

| Item | Detalhe |
|------|---------|
| Matriz RBAC | `lib/security/org-roles.ts` — permissão `diagnostics.write` |
| Mutations | `requireOrgPermission(tenant, "diagnostics.write")` em `diagnostico.salvar` e `diagnostico.analisar` (`server/routers.ts`) |
| Leitura | `diagnostico.historico` — sem exigência de `diagnostics.write` (inalterado na 0B) |
| Tenant | `organizationProcedure`, `assertRelatedIdsInTenant` / escopo AI conforme fluxo existente |

---

## Testes

| Evidência | Resultado |
|-----------|-----------|
| `tests/diagnostics-rbac.test.ts` | Homologação com MySQL e schema preparado: **7/7 PASS**, 0 skipped (sessão dedicada) |
| Auditoria pré-merge PR #34 | **Aprovada tecnicamente** — sem bloqueador de bypass de escrita |

**Observação:** em ambiente local com `afu_mobile` desatualizado (sem colunas do schema atual), a suíte pode **skip** no `beforeAll`; a evidência de integração permanece homologação 7/7 e CI com `db:schema:prepare`.

---

## CI pós-merge

| Campo | Valor |
|-------|--------|
| Run | [31065903370](https://github.com/ivansobierai-cyber/afu-mobile-v2/actions/runs/31065903370) |
| Evento | push `main` (merge PR #34) |
| `headSha` | `37a74ff6d59fb4dc64b08caffbda9878d040886c` |
| Job | `validate` |
| Conclusão | **SUCCESS** (inclui `npm run test:ci` com `DATABASE_URL`) |

---

## Conclusão

**SUBFASE 0B CONCLUÍDA / VERIFICADA** — P0 `diagnostics.write` fechado no MAPA §7.
